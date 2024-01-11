import {
    WebSkel,
    closeModal,
    StorageManager,
    DocumentFactory,
} from "./imports.js";

window.webSkel = new WebSkel();
window.mainContent = document.querySelector("#app-wrapper");


async function loadPage() {

    let leftSidebarPlaceholder = document.querySelector(".left-sidebar-placeholder");

    storageManager.setCurrentService("FileSystemStorage");

    let splitUrl = window.location.hash.slice(1).split('/');
    let spaceId = splitUrl[0];
    let pagePlaceholder = document.querySelector("#page-placeholder");
    if (pagePlaceholder) {
        pagePlaceholder.style.display = "none";
    }
    if (spaceId) {
        if (spaceId === "authentication-page") {
            leftSidebarPlaceholder.style.display = "none";
            await webSkel.changeToDynamicPage(spaceId, spaceId);
        } else {
            let authenticationResult=await webSkel.getService("AuthenticationService").initUser(spaceId);
            if(authenticationResult === true) {
                if (splitUrl[1]) {
                    /* appName, applicationLocation that will get passed to the application itself to be handled */
                    await webSkel.getService("ApplicationsService").startApplication(splitUrl[1], splitUrl.slice(2));
                }else{
                    document.querySelector("#page-content").insertAdjacentHTML("beforebegin", `<left-sidebar data-presenter="left-sidebar" ></left-sidebar>`);
                    await webSkel.changeToDynamicPage("agent-page", `${webSkel.currentUser.space.id}/agent-page`);

                }
            }
        }
    } else {
        if(await webSkel.getService("AuthenticationService").initUser()) {
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
        let page=dataAction.split(" ")[1];
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

async function loadConfigs(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const config = await response.json();

        for (const service of config.services) {
            const ServiceModule = await import(service.path);
            webSkel.initialiseService(service.name, ServiceModule[service.name]);
        }
        for (const storageService of config.storageServices) {
            const StorageServiceModule = await import(storageService.path);
            if (storageService.params) {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name](...Object.values(storageService.params)));
            } else {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
            }
        }
        for (const application of config.applications) {
            webSkel.applications.push(application);
        }

        for (const presenter of config.presenters) {
            const PresenterModule = await import(presenter.path);
            webSkel.registerPresenter(presenter.name, PresenterModule[presenter.className]);
        }
        for (const component of config.components) {
            await webSkel.defineComponent(component.name, component.path, component.cssPaths);
        }
    } catch (error) {
        console.error(error);
        await showApplicationError("Error loading configs", "Error loading configs", `Encountered ${error} while trying loading webSkel configs`);
    }
}

async function handleHistory(event) {
    const result = webSkel.getService("AuthenticationService").getCachedCurrentUser();
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

(async () => {
    await webSkel.defineComponent("general-loader", "./wallet/web-components/components/general-loader/general-loader.html");
    await webSkel.UtilsService.initialize();
    const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    window.storageManager = new StorageManager();
    window.documentFactory = new DocumentFactory();
    webSkel.defaultApplicationId="SpaceConfiguration";
    await loadConfigs("./wallet/webskel-configs.json");
    await loadPage();
    defineActions();
    loading.close();
    loading.remove();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();