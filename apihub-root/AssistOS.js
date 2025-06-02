import WebSkel from "../WebSkel/webSkel.js";
import NotificationManager from "./wallet/core/NotificationManager.js";

document.querySelector('#default-loader-markup').showModal();
let currentTheme = localStorage.getItem('theme');
const htmlElement = document.getElementsByTagName('html')[0];
htmlElement.setAttribute('theme', currentTheme);

const textIndentMap = Object.freeze({
    0: "text-indent-0",
    2: "text-indent-2",
    4: "text-indent-4",
    6: "text-indent-6",
    8: "text-indent-8",
    10: "text-indent-10",
    12: "text-indent-12",
    14: "text-indent-14",
    16: "text-indent-16",
    18: "text-indent-18",
    20: "text-indent-20",
    22: "text-indent-22",
    24: "text-indent-24",
    28: "text-indent-28",
    32: "text-indent-32",
    36: "text-indent-36",
    48: "text-indent-48",
    72: "text-indent-72"
})
const textFontSizeMap = Object.freeze({
    8: "xx-small",
    10: "x-small",
    12: "small",
    14: "medium",
    16: "large",
    18: "x-large",
    20: "xx-large",
    22: "xxx-large",
    24: "xxxx-large",
    28: "xxxxx-large",
    32: "xxxxxx-large",
    36: "xxxxxxx-large",
    48: "xxxxxxxx-large",
    72: "xxxxxxxxx-large"
});

const textFontFamilyMap = Object.freeze({
    "Arial": "font-arial",
    "Georgia": "font-georgia",
    "Courier New": "font-courier-new",
    "Times New Roman": "font-times-new-roman",
    "Verdana": "font-verdana"
});
const authPage = "landing-page";
class AssistOS {
    constructor(configuration) {
        if (AssistOS.instance) {
            return AssistOS.instance;
        }
        this.configuration = configuration;
        this.notificationMonitor = "closed";
        this.constants = {
            fontSizeMap: textFontSizeMap,
            fontFamilyMap: textFontFamilyMap,
            textIndentMap: textIndentMap
        };
        this.NotificationRouter = new NotificationManager();
        this.user = {};
        AssistOS.instance = this;
        return AssistOS.instance;
    }

    async boot(uiConfigsPath) {
        this.UI = await WebSkel.initialise(uiConfigsPath);
        this.initialisedApplications = new Set();
    }

    async changeApplicationLocation(appLocation, presenterParams) {
        let baseURL = `${assistOS.space.id}/${assistOS.currentApplicationName}`
        let webComponentPage = appLocation.split("/").slice(-1)[0];
        let completeURL = [baseURL, appLocation].join("/");
        await assistOS.UI.changeToDynamicPage(webComponentPage, completeURL, presenterParams)
    }

    async getApplicationComponent(spaceId, appId, appComponentsDirPath, component) {
        const applicationModule = this.loadModule("application");
        const HTMLPath = `${appComponentsDirPath}/${component.name}/${component.name}.html`
        const CSSPath = `${appComponentsDirPath}/${component.name}/${component.name}.css`
        let loadedTemplate = await applicationModule.getApplicationFile(spaceId, appId, HTMLPath);
        let loadedCSSs = await applicationModule.getApplicationFile(spaceId, appId, CSSPath);
        let presenterModule = "";
        if (component.presenterClassName) {
            const PresenterPath = `${appComponentsDirPath}/${component.name}/${component.name}.js`
            presenterModule = await applicationModule.getApplicationFile(spaceId, appId, PresenterPath);
        }
        loadedCSSs = [loadedCSSs];
        return {loadedTemplate, loadedCSSs, presenterModule};
    }

    async startApplication(appName, applicationLocation, isReadOnly) {
        const initialiseApplication = async () => {
            const applicationModule = this.loadModule("application");
            assistOS.initialisedApplications[appName] = await applicationModule.getApplicationConfig(assistOS.space.id, appName);
            if (assistOS.initialisedApplications[appName].manager) {
                let ManagerModule = await applicationModule.getApplicationFile(assistOS.space.id, appName, assistOS.initialisedApplications[appName].manager.path)
                assistOS.initialisedApplications[appName].manager = new ManagerModule[assistOS.initialisedApplications[appName].manager.name](appName);
                await assistOS.initialisedApplications[appName].manager.loadAppData?.();
            }
            for (let component of assistOS.initialisedApplications[appName].components) {
                let alreadyLoadedComponent = assistOS.UI.configs.components.find(c => c.name === component.name);
                if (alreadyLoadedComponent) {
                    continue;
                }
                component = {
                    ...await this.getApplicationComponent(assistOS.space.id, appName, assistOS.initialisedApplications[appName].componentsDirPath, component),
                    ...component
                }
                assistOS.UI.configs.components.push(component);
                await assistOS.UI.defineComponent(component);
            }
        }

        const applicationContainer = document.querySelector("#page-content");

        if (document.querySelector("left-sidebar") === null) {
            applicationContainer.insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
        }
        if (appName === assistOS.configuration.defaultApplicationName) {
            if (!applicationLocation) {
                applicationLocation = ["documents-page  "];
            }
            await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/${applicationLocation.join("/")}`)
            return;
        }
        if (!assistOS.initialisedApplications[appName]) {
            assistOS.UI.showLoading();
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
        const removeSidebar = () => {
            let sidebar = document.querySelector("left-sidebar");
            if (sidebar) {
                sidebar.remove();
            }
        }
        this.NotificationRouter.closeSSEConnection();
        const userModule = this.loadModule("user");
        await userModule.logoutUser();
        await this.refresh();
    }

    async refresh() {
        window.location = "/";
    }


    async initSpace(spaceId) {
        const spaceModule = this.loadModule("space");
        assistOS.space = await spaceModule.getSpaceStatus(spaceId);
        const applicationModule = this.loadModule("application");
        assistOS.space.applications = await applicationModule.getApplications(assistOS.space.id);
        assistOS.currentApplicationName = this.configuration.defaultApplicationName;
        let defaultPlugins = await fetch("./wallet/core/plugins/defaultPlugins.json");

        defaultPlugins = await defaultPlugins.json();
        assistOS.space.plugins = defaultPlugins;
        await this.loadAgent(assistOS.space.id);
        // let applicationPlugins = await applicationModule.getApplicationsPlugins(assistOS.space.id);
        // for (let pluginType in applicationPlugins) {
        //     if (!assistOS.space.plugins[pluginType]) {
        //         assistOS.space.plugins[pluginType] = [];
        //     }
        //     assistOS.space.plugins[pluginType] = assistOS.space.plugins[pluginType].concat(applicationPlugins[pluginType]);
        // }
    }

    async loadAgent(spaceId, agentId) {
        if (!agentId) {
            agentId = localStorage.getItem("agent");
            if(agentId === "undefined"){
                agentId = undefined;
            }
        }
        let agent;
        const agentModule = this.loadModule("agent");

        try {
            agent = await agentModule.getAgent(spaceId, agentId);
        } catch (error) {
            agent = await  agentModule.getDefaultAgent(spaceId);
        }
        localStorage.setItem("agent", agent.name);
        assistOS.agent = agent;
    }

    async changeAgent(agentId) {
        await this.loadAgent(assistOS.space.id, agentId);
    }

    watchTask(taskId) {
        if (this.notificationMonitor === "closed") {
            this.openNotificationMonitor();
        }
        document.querySelector('notifications-monitor').webSkelPresenter.addTaskWatcher(taskId);
    }

    openNotificationMonitor() {
        if (this.notificationMonitor === "open") {
            return;
        }
        document.querySelector('notifications-monitor').classList.remove('closed')
        this.notificationMonitor = "open";
    }

    closeNotificationMonitor() {
        if (this.notificationMonitor === "closed") {
            return;
        }
        document.querySelector('notifications-monitor').classList.add('closed')
        this.notificationMonitor = "closed";
    }

    async createSpace(spaceName) {
        const spaceModule = this.loadModule("space");
        let spaceId = await spaceModule.createSpace(spaceName);
        window.location.hash = "#" + spaceId;
        await this.loadPage(assistOS.user.email, spaceId);
    }

    async initPage(applicationName, applicationLocation) {
        hidePlaceholders();
        this.insertSidebar();
        if (applicationName) {
            await assistOS.startApplication(applicationName, applicationLocation);
        } else {
            await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/documents-page`);
        }
    };

    insertSidebar = () => {
        if (!document.querySelector("left-sidebar")) {
            document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar"></left-sidebar>`);
        } else {
            document.querySelector("left-sidebar").webSkelPresenter.invalidate();
        }
    }

    async initUser(email) {
        const userModule = this.loadModule("user");
        assistOS.user = await userModule.loadUser(email);
        assistOS.user.email = localStorage.getItem("userEmail");
        assistOS.user.id = localStorage.getItem("userEmail");
    }
    async loadPage(email, spaceId) {
        let {spaceIdURL, applicationName, applicationLocation} = getURLData(window.location.hash);

        spaceId = spaceId || spaceIdURL;

        if ((spaceId === authPage && email) || spaceId === "login-page") {
            spaceId = undefined;
        }

        if (spaceId === authPage) {
            hidePlaceholders();
            return assistOS.UI.changeToDynamicPage(spaceId, spaceId);
        }

        try {
            await assistOS.initUser(email);
            await assistOS.initSpace(spaceId);
            try {
                this.NotificationRouter.createSSEConnection();
                this.NotificationRouter.getEventSource().onopen = async () => {
                    //this = assistOS
                    this.spaceEventsHandler = async (event) => {
                        if (event === "delete") {
                            alert("Space has been deleted. You will be logged out");
                            await assistOS.logout();
                        }
                    };
                    await this.NotificationRouter.subscribeToSpace(assistOS.space.id, "space", this.spaceEventsHandler);
                }

            } catch (error) {
                await showApplicationError("Error", "Failed to establish connection to the server", error.message);
            }
            await this.initPage(applicationName, applicationLocation);
        } catch (error) {
            console.error(error);
            hidePlaceholders();
            await assistOS.UI.changeToDynamicPage(authPage, authPage);
        }
    }

    async inviteCollaborators(collaboratorEmails) {
        const spaceModule = this.loadModule("space");
        return await this.loadifyFunction(spaceModule.addCollaborators, assistOS.user.email, assistOS.space.id, collaboratorEmails, assistOS.space.name);
    }

    async callFlow(flowName, context, personalityId) {
        return await flowModule.callFlow(assistOS.space.id, flowName, context, personalityId);
    }

    async loadifyComponent(componentElement, asyncFunc, ...args) {
        const removeComponentLoader = (componentElement) => {
            const loader = componentElement.querySelector('.component-loader');
            if (loader) loader.remove();
        }
        const addComponentLoader = (componentElement) => {
            const loader = document.createElement('div');
            loader.classList.add('component-loader');
            componentElement.style.position = 'relative';
            componentElement.appendChild(loader);
            componentElement.style.pointerEvents = 'none';
            return loader
        }
        try {
            addComponentLoader(componentElement);
            return await asyncFunc(...args);
        } catch (error) {
            throw error;
        } finally {
            removeComponentLoader(componentElement);
            componentElement.style.pointerEvents = 'auto';
        }
    }

    async loadifyFunction(asyncFunc, ...args) {
        const loaderId = this.UI.showLoading();
        try {
            return await asyncFunc(...args);
        } catch (error) {
            throw error;
        } finally {
            await this.UI.hideLoading(loaderId);
        }
    }

    loadModule(moduleName) {
        let securityContext = {
            userId: assistOS.user.id,
            email: assistOS.user.email,
        }
        switch (moduleName) {
            case "space":
                return require("assistos").loadModule("space", securityContext);
            case "user":
                return require("assistos").loadModule("user", securityContext);
            case "agent":
                return require("assistos").loadModule("agent", securityContext);
            case "document":
                return require("assistos").loadModule("document", securityContext);
            case "application":
                return require("assistos").loadModule("application", securityContext);
            case "llm":
                return require("assistos").loadModule("llm", securityContext);
            case "webassistant":
                return require("assistos").loadModule("webassistant", securityContext);
            case "util":
                return require("assistos").loadModule("util", securityContext);
            case "chat":
                return require("assistos").loadModule("chat", securityContext);
            default:
                throw new Error("Module doesn't exist");
        }
    }

    showToast(message, type, timeout = 1500) {
        let toastContainer = document.querySelector(".toast-container");
        let toast = document.createElement("div");
        toast.classList.add("timeout-toast");
        toast.classList.add(type);
        toast.innerHTML = `
            <div class="toast-left">
                <img src="./wallet/assets/icons/${type}.svg" alt="${type} icon" class="toast-icon">
                <div class="message-type">${type.charAt(0).toUpperCase() + type.slice(1)}:</div>
                <div class="toast-message">${message}</div>
            </div>
            <div class="close" aria-label="Close">
                <img class="close-icon" src="./wallet/assets/icons/x-mark.svg" alt="close">
            </div>`;
        toastContainer.appendChild(toast);
        let timeoutId = setTimeout(() => {
            toast.remove();
        }, timeout);
        let closeButton = toast.querySelector(".close");
        closeButton.addEventListener("click", () => {
            clearTimeout(timeoutId);
            toast.remove();
        });
    }
}

export function changeSelectedPageFromSidebar(url) {
    let element = document.getElementById('selected-page');
    if (element) {
        element.removeAttribute('id');
        let paths = element.querySelectorAll("path");
        paths.forEach((path) => {
            if (path.getAttribute("stroke-linejoin") === "round" || path.getAttribute("stroke-linecap") === "round") {
                path.setAttribute("stroke", "var(--plugin-focus)");
            } else {
                path.setAttribute("fill", "var(--plugin-focus)");
            }
        });
        let appFocus = element.querySelector('.app-focus');
        appFocus.classList.add("hidden");
    }
    let divs = document.querySelectorAll('.sidebar-item');
    for (let div of divs) {
        let dataAction = div.getAttribute('data-local-action');
        let page = dataAction.split(" ")[1];
        if (url.includes(page)) {
            let appFocus = div.querySelector('.app-focus');
            appFocus.classList.remove("hidden");
            div.setAttribute('id', 'selected-page');
            let paths = div.querySelectorAll("path");
            paths.forEach((path) => {
                if (path.getAttribute("stroke-linejoin") === "round" || path.getAttribute("stroke-linecap") === "round") {
                    path.setAttribute("stroke", "#08C");
                } else {
                    path.setAttribute("fill", "#08C");
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
    assistOS.UI.registerAction("toggleSidebar", async (_target) => {
        const arrow = _target.querySelector("#point-arrow-sidebar");
        const sidebar = document.querySelector(".right-sidebar");
        if (assistOS.UI.sidebarState === "closed") {
            sidebar.style.transform = "translateX(0%)";
            arrow.classList.toggle("arrow-rotated");
            assistOS.UI.sidebarState = "open";
        } else {
            sidebar.style.transform = "translateX(80%)";
            arrow.classList.toggle("arrow-rotated");
            assistOS.UI.sidebarState = "closed";
        }
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
    UILoader.style.remove();
}

(async () => {
    function getCookie(name) {
        const cookieValue = document.cookie.split('; ').find(row => row.startsWith(name + '='))?.split('=')[1];
        return cookieValue || null;
    }

    const ASSISTOS_CONFIGS_PATH = "./assistOS-configs.json";
    const UI_CONFIGS_PATH = "./wallet/webskel-configs.json"

    window.handleHistory = async (event) => {
        if (window.location.hash.includes(`#${authPage}`)) {
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

    assistOS.navigateToPage = function(page){
        if(location.hash.split("/")[1] !== "Space"){
            assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/${page}`);
        }else{
            document.querySelector("space-application-page").webSkelPresenter.changePage(page);
        }
    }
    assistOS.UI.setLoading(loader);
    assistOS.UI.setDomElementForPages(document.querySelector("#page-content"));
    assistOS.UI.sidebarState = "closed";
    defineActions();
    closeDefaultLoader()
    await assistOS.loadPage();
    assistOS.changeSelectedPageFromSidebar = changeSelectedPageFromSidebar;
})();
