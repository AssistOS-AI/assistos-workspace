import {
    WebSkel,
    closeModal,
    StorageManager,
    DocumentFactory,
} from "./imports.js";

window.mainContent = document.querySelector("#app-wrapper");
const CONFIGS_PATH = "./wallet/webskel-configs.json"
const loader = await (await fetch("./wallet/general-loader.html")).text();

async function loadPage() {

    let leftSidebarPlaceholder = document.querySelector(".left-sidebar-placeholder");

    storageManager.setCurrentService("FileSystemStorage");

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
            await webSkel.changeToDynamicPage(spaceId, spaceId);
        } else {
            let authenticationResult = await webSkel.appServices.initUser(spaceId);
            if (authenticationResult === true) {
                if (splitUrl[1]) {
                    /* appName, applicationLocation that will get passed to the application itself to be handled */
                    await webSkel.appServices.startApplication(splitUrl[1], splitUrl.slice(2));
                } else {
                    document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
                    await webSkel.changeToDynamicPage("agent-page", `${webSkel.currentUser.space.id}/agent-page`);
                }
            }
        }
    } else {
        if (await webSkel.appServices.initUser()) {
            document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
            /*let agent = "space/agent-page";
            let url = "#space/agent-page";
            const content = `<${agent} data-presenter="${agent}"></${agent}>`;
            history.replaceState({agent, relativeUrlContent: content}, url, url);
            window.location.replace("#space/agent-page");*/
            await webSkel.changeToDynamicPage("agent-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/agent-page`);

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
    divs.forEach(div => {
        let dataAction = div.getAttribute('data-local-action');
        let page = dataAction.split(" ")[1];
        if (url.includes(page)) {
            div.setAttribute('id', 'selected-page');
            let paths = div.querySelectorAll("path");
            paths.forEach((path) => {
                path.setAttribute("fill", "var(--left-sidebar)");
            });
        }
    });
}

function defineActions() {
    webSkel.registerAction("closeErrorModal", async (_target) => {
        closeModal(_target);
    });
}


async function handleHistory(event) {
    const result = webSkel.appServices.getCachedCurrentUser();
    if (!result) {
        if (window.location.hash !== "#authentication-page") {
            webSkel.setDomElementForPages(mainContent);
            window.location.hash = "#authentication-page";
            await webSkel.changeToDynamicPage("authentication-page", "authentication-page", "", true);
        }
    } else {
        if (history.state) {
            if (history.state.pageHtmlTagName === "authentication-page") {
                const path = ["#", webSkel.currentState.pageHtmlTagName].join("");
                history.replaceState(webSkel.currentState, path, path);
            }
        }
    }
    let modal = document.querySelector("dialog");
    if (modal) {
        closeModal(modal);
    }
}

function saveCurrentState() {
    webSkel.currentState = Object.assign({}, history.state);
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

async function loadAssistOSConfigs(configPath) {
    const response = await fetch(configPath);
    const configs = await response.json();
    for (const storageService of configs.storageServices) {
        const StorageServiceModule = await import(storageService.path);
        if (storageService.params) {
            storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name](...Object.values(storageService.params)));
        } else {
            storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
        }
    }
    webSkel.applications = {};
    webSkel.initialisedApplications = new Set();
    for (const application of configs.applications) {
        webSkel.applications[application.name] = application;
    }
    webSkel.setLoading(loader);
    webSkel.defaultApplicationName = configs.defaultApplicationName;
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
}


(async () => {
    window.storageManager = new StorageManager();
    window.documentFactory = new DocumentFactory();
    window.webSkel = await WebSkel.initialise(CONFIGS_PATH);
    await loadAssistOSConfigs('./wallet/assistOS-configs.json');
    defineActions();
    await loadPage();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();