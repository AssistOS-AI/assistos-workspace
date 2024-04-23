import WebSkel from "../WebSkel/webSkel.js";
import * as dependencies from "./wallet/imports.js";
import {IFlow} from "./wallet/core/flow/IFlow.js";

class AssistOS {
    constructor(configuration) {
        if (AssistOS.instance) {
            return AssistOS.instance;
        }
        this.configuration = configuration;
        AssistOS.instance = this;
        return AssistOS.instance;
    }

    async boot(uiConfigsPath) {
        const initialiseModules = async (configName) => {
            this[configName] = {};
            const loadModule = async (obj) => {
                const module = await import(obj.path);
                let service = new module[obj.name]();
                const methodNames = Object.getOwnPropertyNames(module[obj.name].prototype)
                    .filter(method => method !== 'constructor');
                return {service, methodNames};
            };

            const modulePromises = this.configuration[configName].map(obj => loadModule(obj));
            const modules = await Promise.allSettled(modulePromises);

            modules.forEach(result => {
                if (result.status === 'fulfilled') {
                    const {service, methodNames} = result.value;
                    methodNames.forEach(methodName => {
                        this[configName][methodName] = service[methodName].bind(service);
                    });
                }
            });
        };

        this.UI = await WebSkel.initialise(uiConfigsPath);
        //this.storage = new StorageManager();

        const initialisePromises = [
            initialiseModules("services"),
            initialiseModules("factories")
        ];

        this.applications = {};
        this.initialisedApplications = new Set();
        this.configuration.applications.forEach(application => {
            this.applications[application.name] = application;
        });
        this.currentApplicationName = this.configuration.defaultApplicationName;
        await Promise.all(initialisePromises);
    }

    async refresh() {
        await this.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/announcements-page`);
    }

    async loadPage(skipAuth = false, skipSpace = false, spaceId) {
        const initPage = async () => {
            const insertSidebar = () => {
                if (!document.querySelector("left-sidebar")) {
                    document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar"></left-sidebar>`);
                }
            }
            hidePlaceholders();
            insertSidebar();
            if (applicationName) {
                await assistOS.services.startApplication(applicationName, applicationLocation);
            } else {
                await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/announcements-page`);
            }
        };

        let {spaceIdURL, applicationName, applicationLocation} = getURLData(window.location.hash);
        spaceId = spaceId ? spaceId : spaceIdURL;
        if (spaceId === "authentication-page" && skipAuth) {
            spaceId = undefined;
        }

        if (spaceId === "authentication-page") {
            hidePlaceholders();
            return assistOS.UI.changeToDynamicPage(spaceId, spaceId);
        }

        try {
            await (spaceId ? skipSpace ? assistOS.services.initUser() : assistOS.services.initUser(spaceId) : assistOS.services.initUser());
            await initPage();
        } catch (error) {
            hidePlaceholders();
            await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page");
        }
    }

    async callFlow(flowName, context, personalityId) {
        let flowObj;
        try {
            flowObj = initFlow(flowName, context, personalityId);
        }catch (e) {
            console.error(e);
            return await showApplicationError(e, e, e.stack);
        }

        let response;
        try {
            response = await ((context, personality)=>{
                let returnPromise = new Promise((resolve, reject) => {
                    flowObj.flowInstance.resolve = resolve;
                    flowObj.flowInstance.reject = reject;
                });
                flowObj.flowInstance.personality = personality;
                flowObj.flowInstance.start(context, personality);
                return returnPromise;
            })(context, flowObj.personality);
        }catch (e) {
            console.error(e);
            return await showApplicationError("Flow execution Error", `Error executing flow ${flowObj.flowInstance.constructor.name}`, e);
        }
        if(flowObj.flowClass.outputSchema){
            if(typeof flowObj.flowClass.outputSchema.isValid === "undefined"){
                try {
                    let parsedResponse = JSON.parse(response);
                    //assistOS.services.validateSchema(parsedResponse, flowObj.flowClass.outputSchema, "output");
                    return parsedResponse;
                }catch (e) {
                    console.error(e);
                    return await showApplicationError(e, e, e.stack);
                }
            }
        }
        return response;

        function initFlow(flowName, context, personalityId){
            let flow;
            if(assistOS.currentApplicationName === assistOS.configuration.defaultApplicationName){
                flow = assistOS.space.getFlow(flowName);
            } else {
                let app = assistOS.space.getApplicationByName(assistOS.currentApplicationName);
                flow = app.getFlow(flowName);
            }
            let personality;
            if(personalityId){
                personality = assistOS.space.getPersonality(personalityId);
            } else {
                personality = assistOS.space.getPersonalityByName(dependencies.constants.DEFAULT_PERSONALITY_NAME);
            }
            if(flow.class.inputSchema){
                // assistOS.services.validateSchema(context, flow.class.inputSchema, "input");
            }
            let usedDependencies = [];
            if(flow.class.dependencies){
                for(let functionName of flow.class.dependencies){
                    usedDependencies.push(dependencies[functionName]);
                }
            }
            let flowInstance = new flow.class(...usedDependencies);
            if(flowInstance.start === undefined){
                throw new Error(`Flow ${flowInstance.constructor.name} must have a function named 'start'`);
            }
            const apis = Object.getOwnPropertyNames(IFlow.prototype)
                .filter(method => method !== 'constructor');
            apis.forEach(methodName => {
                flowInstance[methodName] = IFlow.prototype[methodName].bind(flowInstance);
            });
            if(flow.class.inputSchema){
                // assistOS.services.validateSchema(context, flow.class.inputSchema, "input");
            }
            return {flowInstance:flowInstance, flowClass:flow.class, personality: personality};
        }
    }
    loadModule(moduleName) {
        switch (moduleName) {
            case "space": return import("./wallet/core/space/index.js");
            case "user": return import("./wallet/core/user/index.js");
            case "personality": return import("./wallet/core/personality/personality.js");
            default: console.error("Module doesn't exist"); break;
        }
    }
}

export function changeSelectedPageFromSidebar(url) {
    let element = document.getElementById('selected-page');
    if (element) {
        element.removeAttribute('id');
        let paths = element.querySelectorAll("path");
        paths.forEach((path) => {
            path.setAttribute("fill", "white");
        });
    }
    let divs = document.querySelectorAll('.feature');
    for (let div of divs) {
        let dataAction = div.getAttribute('data-local-action');
        let page = dataAction.split(" ")[1];
        if (url.includes(page)) {
            div.setAttribute('id', 'selected-page');
            let paths = div.querySelectorAll("path");
            paths.forEach((path) => {
                path.setAttribute("fill", "var(--left-sidebar)");
            });
            return;
        }
    }
}

function getURLData(url) {
    let URLParts = url.slice(1).split('/');
    return {
        spaceId: URLParts[0],
        applicationName: URLParts[1],
        applicationLocation: URLParts.slice(2)
    }
}

function hidePlaceholders() {
    let leftSidebarPlaceholder = document.querySelector(".left-sidebar-placeholder");
    let pagePlaceholder = document.querySelector("#page-placeholder");
    if (leftSidebarPlaceholder) {
        leftSidebarPlaceholder.style.display = "none";
    }
    if (pagePlaceholder) {
        pagePlaceholder.style.display = "none";
    }
}


function defineActions() {
    assistOS.UI.registerAction("closeErrorModal", async (_target) => {
        assistOS.UI.closeModal(_target);
    });
}

async function handleHistory(event) {
    if (window.location.hash !== "#authentication-page") {
        assistOS.UI.setDomElementForPages(mainContent);
        window.location.hash = "#authentication-page";
        await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page", "", true);
    }
    let modal = document.querySelector("dialog");
    if (modal) {
        assistOS.UI.closeModal(modal);
    }
}

function saveCurrentState() {
    assistOS.UI.currentState = Object.assign({}, history.state);
}

function closeDefaultLoader() {
    let UILoader = {
        "modal": document.querySelector('#default-loader-markup'),
        "style": document.querySelector('#default-loader-style'),
        "script": document.querySelector('#default-loader-script')
    }
    UILoader.modal.close();
    UILoader.modal.remove();
    UILoader.script.remove();
    UILoader.style.remove();
}

(async () => {
    const ASSISTOS_CONFIGS_PATH = "./assistOS-configs.json";
    const UI_CONFIGS_PATH = "./wallet/webskel-configs.json"

    window.mainContent = document.querySelector("#app-wrapper");

    const configuration = await (await fetch(ASSISTOS_CONFIGS_PATH)).json();
    const loader = await (await fetch("./wallet/general-loader.html")).text();

    window.assistOS = new AssistOS(configuration);
    await assistOS.boot(UI_CONFIGS_PATH);

    assistOS.UI.setLoading(loader);
    assistOS.UI.setDomElementForPages(document.querySelector("#page-content"));
    defineActions();
    closeDefaultLoader()
    await assistOS.loadPage();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();
