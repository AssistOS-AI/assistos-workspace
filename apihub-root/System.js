import {
    closeModal,
    WebSkel,
    StorageManager
} from "./wallet/imports.js";

class System {
    constructor(configuration) {
        if (System.instance) {
            return System.instance;
        }
        this.configuration = configuration;
        const validationResults = this.validateConfiguration(configuration);
        if (!validationResults.status) {
            throw new Error(validationResults.errorMessage);
        }
        System.instance = this;
        return System.instance;
    }

    validateConfiguration(configuration) {
        /*if (!configuration.UIConfiguration) {
            return {"status": false, "errorMessage": "UIConfiguration is missing"};
        }*/
        return {"status": true};
    }

    async boot(uiConfigsPath) {
        const initialiseModules = async (configName) => {
            this[configName] = {};
            const loadModule = async (obj) => {
                const module = await import(obj.path);
                let service = new module[obj.name]();
                const methodNames = Object.getOwnPropertyNames(module[obj.name].prototype)
                    .filter(method => method !== 'constructor');
                return { service, methodNames };
            };

            const modulePromises = this.configuration[configName].map(obj => loadModule(obj));
            const modules = await Promise.allSettled(modulePromises);

            modules.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { service, methodNames } = result.value;
                    methodNames.forEach(methodName => {
                        this[configName][methodName] = service[methodName].bind(service);
                    });
                }
            });
        };

        this.UI = await WebSkel.initialise(uiConfigsPath);
        this.storage = new StorageManager();
        const storageServicePromises = this.configuration.storageServices.map(async storageService => {
            const StorageServiceModule = await import(storageService.path);
            this.storage.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
        });
        await Promise.all(storageServicePromises);

        const initialisePromises = [
            initialiseModules("services"),
            initialiseModules("factories")
        ];

        this.applications = {};
        this.initialisedApplications = new Set();
        this.configuration.applications.forEach(application => {
            this.applications[application.name] = application;
        });
        this.defaultApplicationName = this.configuration.defaultApplicationName;
        await Promise.all(initialisePromises);
    }


    async shutdown() {
    }

    async reboot() {
        /*await this.shutdown();
        await this.boot();*/
        window.location = "";
    }

    async refresh() {
        /* ... */
        await this.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/announcements-page`);
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

(async () => {
    const ASSISTOS_CONFIGS_PATH = "./assistOS-configs.json";
    const UI_CONFIGS_PATH = "./wallet/webskel-configs.json"

    window.mainContent = document.querySelector("#app-wrapper");
    const loader = await (await fetch("./wallet/general-loader.html")).text();

    async function loadPage() {

        let leftSidebarPlaceholder = document.querySelector(".left-sidebar-placeholder");
        let splitUrl = window.location.hash.slice(1).split('/');
        let spaceId = splitUrl[0];
        let pagePlaceholder = document.querySelector("#page-placeholder");
        if (pagePlaceholder) {
            pagePlaceholder.style.display = "none";
        }
        closeDefaultLoader();
        if (spaceId) {
            if (spaceId === "authentication-page") {
                leftSidebarPlaceholder.style.display = "none";
                await system.UI.changeToDynamicPage(spaceId, spaceId);
            } else {
                let authenticationResult = await system.services.initUser(spaceId);
                if (authenticationResult === true) {
                    if (splitUrl[1]) {
                        /* appName, applicationLocation that will get passed to the application itself to be handled */
                        await system.services.startApplication(splitUrl[1], splitUrl.slice(2));
                    } else {
                        document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
                        await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/announcements-page`);
                    }
                }
            }
        } else {
            if (await system.services.initUser()) {
                document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
                /*let agent = "space/agent-page";
                let url = "#space/agent-page";
                const content = `<${agent} data-presenter="${agent}"></${agent}>`;
                history.replaceState({agent, relativeUrlContent: content}, url, url);
                window.location.replace("#space/agent-page");*/
                await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/announcements-page`);
            }
        }
    }


    function defineActions() {
        system.UI.registerAction("closeErrorModal", async (_target) => {
            closeModal(_target);
        });
    }


    async function handleHistory(event) {
        const result = system.services.getCachedCurrentUser();
        if (!result) {
            if (window.location.hash !== "#authentication-page") {
                system.UI.setDomElementForPages(mainContent);
                window.location.hash = "#authentication-page";
                await system.UI.changeToDynamicPage("authentication-page", "authentication-page", "", true);
            }
        } else {
            if (history.state) {
                if (history.state.pageHtmlTagName === "authentication-page") {
                    const path = ["#", system.UI.currentState.pageHtmlTagName].join("");
                    history.replaceState(system.UI.currentState, path, path);
                }
            }
        }
        let modal = document.querySelector("dialog");
        if (modal) {
            closeModal(modal);
        }
    }

    function saveCurrentState() {
        system.UI.currentState = Object.assign({}, history.state);
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

    const configuration = await (await fetch(ASSISTOS_CONFIGS_PATH)).json();
    window.system = new System(configuration);
    await system.boot(UI_CONFIGS_PATH);
    system.UI.setLoading(loader);
    system.storage.setCurrentService("FileSystemStorage");
    system.UI.setDomElementForPages(document.querySelector("#page-content"));
    defineActions();
    await loadPage();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();
