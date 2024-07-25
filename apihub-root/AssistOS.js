import WebSkel from "../WebSkel/webSkel.js";
import * as dependencies from "./wallet/imports.js";

const userModule = require('assistos').loadModule('user', {});
const spaceModule = require('assistos').loadModule('space', {});
const applicationModule = require('assistos').loadModule('application', {});
const agentModule = require('assistos').loadModule('personality', {});
const flowModule = require('assistos').loadModule('flow', {});
const personalityModule = require('assistos').loadModule('personality', {})
const utilModule = require('assistos').loadModule('util', {});

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

    }

    async changeApplicationLocation(appLocation, presenterParams) {
        let baseURL = `${assistOS.space.id}/${assistOS.currentApplicationName}`
        let webComponentPage = appLocation.split("/").slice(-1)[0];
        let completeURL = [baseURL, appLocation].join("/");
        await assistOS.UI.changeToDynamicPage(webComponentPage, completeURL, presenterParams)
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
            await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/${applicationLocation.join("/")}`)
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

    async login(email, password) {
        const SSEConfig = {
            url: `/events/updates`,
            withCredentials: true,
            onDisconnect: async (disconnectReason) => {
                await assistOS.UI.showModal("client-disconnect-modal", {"presenter":"client-disconnect-modal",reason: disconnectReason.message});
            },
            onError: async (err) => {
                console.error('EventSource failed:', err);
            }
        }
        await userModule.loginUser(email, password);
        try {
            utilModule.createSSEConnection(SSEConfig);
        }catch(error){
            throw new Error("Successful login, but failed to establish connection with the server. Please try again later");
        }
    }

    async logout() {
        const removeSidebar = () => {
            let sidebar = document.querySelector("left-sidebar");
            if (sidebar) {
                sidebar.remove();
            }
        }
        removeSidebar();
        await utilModule.closeSSEConnection();
        await userModule.logoutUser();
        await this.refresh();

    }

    async refresh() {
        window.location= "/";
    }

    async initUser(spaceId) {
        assistOS.user = await userModule.loadUser();
        assistOS.space = new spaceModule.Space(await spaceModule.loadSpace(spaceId));
        const appsData = await applicationModule.loadApplicationsMetadata(assistOS.space.id);
        appsData.forEach(application => {
            assistOS.applications[application.name] = application;
        });
        assistOS.currentApplicationName = this.configuration.defaultApplicationName;
        await assistOS.space.loadFlows();
        await assistOS.loadAgent(assistOS.space.id);
    }

    async loadAgent(spaceId) {
        const personalityData = await agentModule.getAgent(spaceId);
        assistOS.agent = new personalityModule.models.agent(personalityData);
    }

    async changeAgent(agentId) {
        await this.loadAgent(assistOS.space.id, agentId);
    }

    async createSpace(spaceName, apiKey) {
        await spaceModule.createSpace(spaceName, apiKey);
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
                await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/announcements-page`);
            }
        };
        let {spaceIdURL, applicationName, applicationLocation} = getURLData(window.location.hash);
        spaceId = spaceId ? spaceId : spaceIdURL;
        if (spaceId === "authentication-page" && skipAuth) {
            spaceId = undefined;
        }

        if (spaceId === "authentication-page") {
            hidePlaceholders();
            if (applicationName === "inviteToken") {
                return assistOS.UI.changeToDynamicPage(spaceId, `${spaceId}/${applicationName}/${applicationLocation}`);
            }
            return assistOS.UI.changeToDynamicPage(spaceId, spaceId);
        }

        try {
            await (spaceId ? skipSpace ? assistOS.initUser() : assistOS.initUser(spaceId) : assistOS.initUser());
            await initPage();
        } catch (error) {
            console.info(error);
            hidePlaceholders();
            await assistOS.UI.changeToDynamicPage("authentication-page", "authentication-page");
            throw error
        }
    }

    async inviteCollaborators(collaboratorEmails) {
        return await this.loadifyFunction(spaceModule.inviteSpaceCollaborators, assistOS.space.id, collaboratorEmails);
    }

    async callFlow(flowName, context, personalityId) {
        return await flowModule.callFlow(assistOS.space.id, flowName, context, personalityId);
    }

    async loadifyFunction(asyncFunc, ...args) {
        await this.openLoader();
        try {
            return await asyncFunc(...args);
        } catch (error) {
            await showApplicationError("Error", `Encountered an error during the execution of ${asyncFunc.name || "Undefined Function"}`, {
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
                return require("assistos").loadModule("space", {});
            case "user":
                return require("assistos").loadModule("user", {});
            case "personality":
                return require("assistos").loadModule("personality", {});
            case "document":
                return require("assistos").loadModule("document", {});
            case "application":
                return require("assistos").loadModule("application", {});
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
            if (path.getAttribute("stroke-linejoin") === "round") {
                path.setAttribute("stroke", "var(--left-sidebar-icons)");
            } else {
                path.setAttribute("fill", "var(--left-sidebar-icons)");
            }
        });
        let appFocus = element.querySelector('.app-focus');
        appFocus.classList.add("hidden");
    }
    let divs = document.querySelectorAll('.feature');
    for (let div of divs) {
        let dataAction = div.getAttribute('data-local-action');
        let page = dataAction.split(" ")[1];
        if (url.includes(page)) {
            let appFocus = div.querySelector('.app-focus');
            appFocus.classList.remove("hidden");
            div.setAttribute('id', 'selected-page');
            let paths = div.querySelectorAll("path");
            paths.forEach((path) => {
                if (path.getAttribute("stroke-linejoin") === "round") {
                    path.setAttribute("stroke", "var(--white)");
                } else {
                    path.setAttribute("fill", "var(--white)");
                }
            });
            return;
        }
    }
}

function getURLData(url) {
    let URLParts = url.slice(1).split('/');
    return {
        spaceIdURL: URLParts[0],
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

    window.handleHistory= async (event)=> {
        if (window.location.hash.includes("#authentication-page")) {
            await assistOS.logout();
        }
        let modal = document.querySelector("dialog");
        if (modal) {
            assistOS.UI.closeModal(modal);
        }
    }
    window.addEventListener('popstate', window.handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);

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
    assistOS.changeSelectedPageFromSidebar = changeSelectedPageFromSidebar;
})();
