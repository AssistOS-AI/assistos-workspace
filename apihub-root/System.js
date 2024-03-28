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
        System.instance = this;
        return System.instance;
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

    async refresh() {
        await this.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/announcements-page`);
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
                await system.services.startApplication(applicationName, applicationLocation);
            } else {
                await system.UI.changeToDynamicPage("space-configs-page", `${system.space.id}/SpaceConfiguration/announcements-page`);
            }
        };

        let {spaceIdURL, applicationName, applicationLocation} = getURLData(window.location.hash);
        spaceId = spaceId ? spaceId : spaceIdURL;
        if (spaceId === "authentication-page" && skipAuth) {
            spaceId = undefined;
        }

        if (spaceId === "authentication-page") {
            hidePlaceholders();
            return system.UI.changeToDynamicPage(spaceId, spaceId);
        }

        try {
            await (spaceId ? skipSpace ? system.services.initUser() : system.services.initUser(spaceId) : system.services.initUser());
            await initPage();
        } catch (error) {
            hidePlaceholders();
            await system.UI.changeToDynamicPage("authentication-page", "authentication-page");
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

(async () => {
    const ASSISTOS_CONFIGS_PATH = "./assistOS-configs.json";
    const UI_CONFIGS_PATH = "./wallet/webskel-configs.json"

    window.mainContent = document.querySelector("#app-wrapper");

    const configuration = await (await fetch(ASSISTOS_CONFIGS_PATH)).json();
    const loader = await (await fetch("./wallet/general-loader.html")).text();

    window.system = new System(configuration);
    await system.boot(UI_CONFIGS_PATH);

    system.UI.setLoading(loader);
    system.storage.setCurrentService("FileSystemStorage");
    system.UI.setDomElementForPages(document.querySelector("#page-content"));
    defineActions();
    closeDefaultLoader()
    await system.loadPage();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();
