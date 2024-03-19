import {
    closeModal,
} from "./imports.js";

import AssistSystem from "../System.js";
const ASSISTOS_CONFIGS_PATH = "../assistOS-configs.json";

window.mainContent = document.querySelector("#app-wrapper");
const UI_CONFIGS_PATH = "./wallet/webskel-configs.json"
const loader = await (await fetch("./wallet/general-loader.html")).text();

async function loadPage() {

    let leftSidebarPlaceholder = document.querySelector(".left-sidebar-placeholder");

    system.storage.setCurrentService("FileSystemStorage");

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
    for(let div of divs){
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
    const configuration= await (await fetch(ASSISTOS_CONFIGS_PATH)).json();
    window.system = new AssistSystem(configuration);
    await system.boot(UI_CONFIGS_PATH);

    system.UI.setLoading(loader);
    system.UI.setDomElementForPages(document.querySelector("#page-content"));
    defineActions();
    await loadPage();
    window.addEventListener('popstate', handleHistory);
    window.addEventListener('beforeunload', saveCurrentState);
})();