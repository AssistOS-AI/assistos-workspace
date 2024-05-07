import WebSkel from "../WebSkel/webSkel.js";
import * as dependencies from "./wallet/imports.js";

const userModule = require('assistos').loadModule('user');
const spaceModule = require('assistos').loadModule('space');
const applicationModule = require('assistos').loadModule('application');
const agentModule = require('assistos').loadModule('personality');

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

        await initialiseModules("services");

        this.applications = {};
        this.initialisedApplications = new Set();
        this.configuration.applications.forEach(application => {
            this.applications[application.name] = application;
        });
        this.currentApplicationName = this.configuration.defaultApplicationName;
    }
    async startApplication(appName, applicationLocation, isReadOnly) {
        const initialiseApplication = async () => {
            assistOS.initialisedApplications[appName] = await applicationModule.getApplicationConfigs(assistOS.space.id, appName);
            if (assistOS.initialisedApplications[appName].manager) {
                let ManagerModule = await applicationModule.getApplicationFile(assistOS.space.id, appName, assistOS.initialisedApplications[appName].manager.path)
                assistOS.initialisedApplications[appName].manager = new ManagerModule[assistOS.initialisedApplications[appName].manager.name](appName);
                await assistOS.initialisedApplications[appName].manager.loadAppData?.();
            }
            for (let component of assistOS.initialisedApplications[appName].components) {
                component = {
                    ...await getApplicationComponent(assistOS.space.id, appName, assistOS.initialisedApplications[appName].componentsDirPath, component),
                    ...component
                }
                assistOS.UI.configs.components.push(component);
                await assistOS.UI.defineComponent(component);
            }
        }

        const getApplicationComponent = async (spaceId, appId, appComponentsDirPath, component) => {
            const HTMLPath = `${appComponentsDirPath}/${component.name}/${component.name}.html`
            const CSSPath = `${appComponentsDirPath}/${component.name}/${component.name}.css`
            let loadedTemplate = await applicationModule.getApplicationFile(spaceId, appId, HTMLPath)
            let loadedCSSs = await applicationModule.getApplicationFile(spaceId, appId, CSSPath)
            let presenterModule = "";
            if (component.presenterClassName) {
                const PresenterPath = `${appComponentsDirPath}/${component.name}/${component.name}.js`
                presenterModule = await applicationModule.getApplicationFile(spaceId, appId, PresenterPath);
            }
            loadedCSSs = [loadedCSSs];
            return {loadedTemplate, loadedCSSs, presenterModule};
        }

        const applicationContainer = document.querySelector("#page-content");

        if (document.querySelector("left-sidebar") === null) {
            applicationContainer.insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (appName === assistOS.configuration.defaultApplicationName) {
            if (!applicationLocation) {
                applicationLocation = ["announcements-page"];
            }
            await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/${applicationLocation.join("/")}`)
            return;
        }
        if (!assistOS.initialisedApplications[appName]) {
            await assistOS.UI.showLoading();
            await initialiseApplication(appName);
            assistOS.UI.hideLoading();
        }
        try {
            await assistOS.initialisedApplications[appName].manager.navigateToLocation(applicationLocation, isReadOnly);
        } catch (e) {
            console.error(`Encountered an Issue trying to navigate to ${applicationLocation} .Navigating to application entry point`);
            await assistOS.UI.changeToDynamicPage(assistOS.initialisedApplications[appName].entryPointComponent,
                `${assistOS.space.id}/${appName}/${assistOS.initialisedApplications[appName].entryPointComponent}`);
        } finally {
            assistOS.currentApplicationName = appName;
        }
    }

    async logout() {
        await userModule.loadAPIs().logoutUser();
        await this.refresh();
    }

    async refresh() {
        window.location = "";
    }

    async initUser(spaceId, agentId) {
        assistOS.user = new dependencies.User(await userModule.loadAPIs().loadUser());
        assistOS.space = new dependencies.Space(await spaceModule.loadAPIs().loadSpace(spaceId));
        await assistOS.space.loadFlows();
        //await assistOS.loadAgent(spaceId,agentId);

    }

    async loadAgent(spaceId, agentId) {
        const personalityData = await agentModule.getAgent(spaceId, agentId);
        assistOS.agent = new dependencies.Personality(personalityData);
    }

    async changeAgent(agentId) {
        await this.loadAgent(assistOS.space.id, agentId);
    }

    async createSpace(spaceName, apiKey) {
        await spaceModule.loadAPIs().createSpace(spaceName, apiKey);
        await this.loadPage(false, true);
    }

    async loadPage(skipAuth = false, skipSpace = false, spaceId) {
        const initPage = async () => {
            const insertSidebar = () => {
                if (!document.querySelector("left-sidebar")) {
                    document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar"></left-sidebar>`);
                } else {
                    document.querySelector("left-sidebar").webSkelPresenter.invalidate();
                }
            }
            hidePlaceholders();
            insertSidebar();
            if (applicationName) {
                await assistOS.startApplication(applicationName, applicationLocation);
            } else {
                await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/announcements-page`);
            }
        };
        let {spaceIdURL, agentId, applicationName, applicationLocation} = getURLData(window.location.hash);
        spaceId = spaceId ? spaceId : spaceIdURL;
        if (spaceId === "authentication-page" && skipAuth) {
            spaceId = undefined;
        }

        if (spaceId === "authentication-page") {
            hidePlaceholders();
            return assistOS.UI.changeToDynamicPage(spaceId, spaceId);
        }

        try {
            await (spaceId ? skipSpace ? assistOS.initUser(undefined, agentId) : assistOS.initUser(spaceId) : assistOS.initUser(undefined, agentId));
            await initPage();
        } catch (error) {
            hidePlaceholders();
            await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page");
        }
    }

    async inviteCollaborators(collaboratorEmails) {
        await this.loadifyFunction(spaceModule.loadAPIs().inviteSpaceCollaborators, assistOS.space.id, collaboratorEmails);
    }

    async callFlow(flowName, context, personalityId) {
        let flowObj;
        try {
            flowObj = await initFlow(flowName, context, personalityId);
        } catch (e) {
            console.error(e);
            return await showApplicationError(e, e, e.stack);
        }

        let response;
        try {
            response = await ((context, personality) => {
                let returnPromise = new Promise((resolve, reject) => {
                    flowObj.flowInstance.resolve = resolve;
                    flowObj.flowInstance.reject = reject;
                });
                flowObj.flowInstance.personality = personality;
                flowObj.flowInstance.start(context, personality);
                return returnPromise;
            })(context, flowObj.personality);
        } catch (e) {
            console.error(e);
            return await showApplicationError("Flow execution Error", `Error executing flow ${flowObj.flowInstance.constructor.name}`, e);
        }
        if (flowObj.flowClass.outputSchema) {
            if (typeof flowObj.flowClass.outputSchema.isValid === "undefined") {
                try {
                    let parsedResponse = JSON.parse(response);
                    //assistOS.services.validateSchema(parsedResponse, flowObj.flowClass.outputSchema, "output");
                    return parsedResponse;
                } catch (e) {
                    console.error(e);
                    return await showApplicationError(e, e, e.stack);
                }
            }
        }
        return response;

        async function initFlow(flowName, context, personalityId) {
            let flow;
            if (assistOS.currentApplicationName === assistOS.configuration.defaultApplicationName) {
                flow = await assistOS.space.getFlow(flowName);
            } else {
                let app = assistOS.space.getApplicationByName(assistOS.currentApplicationName);
                flow = app.getFlow(flowName);
            }
            let personality;
            if (personalityId) {
                personality = assistOS.space.getPersonality(personalityId);
            } else {
                personality = assistOS.space.getPersonalityByName(dependencies.constants.DEFAULT_PERSONALITY_NAME);
            }
            if (flow.inputSchema) {
                // assistOS.services.validateSchema(context, flow.inputSchema, "input");
            }
            let flowInstance = new flow();
            if (flowInstance.start === undefined) {
                throw new Error(`Flow ${flowInstance.constructor.name} must have a function named 'start'`);
            }
            const apis = Object.getOwnPropertyNames(dependencies.IFlow.prototype)
                .filter(method => method !== 'constructor');
            apis.forEach(methodName => {
                flowInstance[methodName] = dependencies.IFlow.prototype[methodName].bind(flowInstance);
            });
            if (flow.inputSchema) {
                // assistOS.services.validateSchema(context, flow.inputSchema, "input");
            }
            return {flowInstance: flowInstance, flowClass: flow, personality: personality};
        }
    }

    async loadifyFunction(asyncFunc, ...args) {
        await this.openLoader();
        try {
            await asyncFunc(...args);
        } catch (error) {
            await showApplicationError("Error", `Encountered an error during the execution of ${asyncFunc.name||"Undefined Function"}`, {
                message: error.message,
                stack: error.stack,
                function: asyncFunc.name,
                params: args
            });
        } finally {
            await this.closeLoader();
        }
    }

    async openLoader() {
        await assistOS.UI.showLoading();
    }

    async closeLoader() {
        await assistOS.UI.hideLoading();
    }

    loadModule(moduleName) {
        switch (moduleName) {
            case "space":
                return require("assistos-sdk").loadModule("space");
            case "user":
                return require("assistos-sdk").loadModule("user");
            case "personality":
                return require("assistos-sdk").loadModule("personality");
            case "document":
                return require("assistos-sdk").loadModule("document");
            case "application":
                return require("assistos-sdk").loadModule("application");
            default:
                throw new Error("Module doesn't exist");
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
        spaceIdURL: URLParts[0],
        //agentId: URLParts[1],
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
    assistOS.changeSelectedPageFromSidebar = changeSelectedPageFromSidebar;
})();
