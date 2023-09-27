import {
    notBasePage,
    WebSkel,
    closeModal,
    Space,
} from "./imports.js";
import { StorageManager } from "./storageManager.js";

const openDSU = require("opendsu");
window.webSkel = new WebSkel();
window.pageContent = document.querySelector("#page-content");
window.mainContent = document.querySelector("#main-content");

async function loadPage() {
    let url = window.location.hash;
    if(url === "" || url === null) {
        url = "#space-page";
    }
    if(notBasePage(url)) {
        /*#proofReader, #documents */
        changeSelectedPageFromSidebar(url);
        await webSkel.changeToDynamicPage(url.slice(1));
    } else {
        /* URL examples: documents/0, documents/0/chapters/1 */
        switch(url.split('/')[0]) {
            case "#documents": {
                let documentIdURL = parseInt(url.split('/')[1]);
                let chapterIdURL = parseInt(url.split('/')[3]);
                let paragraphIdURL = parseInt(url.split('/')[4]);
                /* To be replaced with space id from URL */
                if (await storageManager.loadObject(currentSpaceId, "documents", documentIdURL) !== null) {
                    webSkel.space.currentDocumentId = documentIdURL;
                    webSkel.space.currentChapterId = chapterIdURL;
                    webSkel.space.currentParagraphId = paragraphIdURL;
                    changeSelectedPageFromSidebar("documents-page");
                }
                changeSelectedPageFromSidebar("documents-page");
                break;
            }
            default: {
                webSkel.space.currentDocumentId = null;
                webSkel.space.currentChapterId = null;
                webSkel.space.currentParagraphId = null;
            }
        }
        await webSkel.changeToStaticPage(url);
    }
}

async function initLiteUserDatabase() {
    window.storageManager = new StorageManager();

    let result = localStorage.getItem("currentUser");
    if(result) {
        window.currentSpaceId = JSON.parse(result).currentSpaceId;
    } else {
        window.currentSpaceId = 1;
    }
}

function changeSelectedPageFromSidebar(url) {
    let element = document.getElementById('selected-page');
    if (element) {
        element.removeAttribute('id');
    }
    let divs = document.querySelectorAll('div[data-action]');
    let targetAction = url;
    if(targetAction.startsWith("#")) {
        targetAction = url.slice(1);
    }
    divs.forEach(div => {
        let dataAction = div.getAttribute('data-action');
        if (dataAction.includes(targetAction)) {
            console.log(`Element with data-action '${targetAction}' found.`);
            div.setAttribute('id', 'selected-page');
        }
    });
}

function defineActions() {
    webSkel.registerAction("changePage", async (_target, pageId, refreshFlag='0') => {
        /* If we are attempting to click the button to the tool page we're currently on, a refreshFlag with the value 0
            will prevent that page refresh from happening and just exit the function
         */
        if(refreshFlag === '0') {
            if(pageId === window.location.hash.slice(1)) {
                return;
            }
        }
        webSkel.currentToolId = pageId;
        changeSelectedPageFromSidebar(pageId);
        await webSkel.changeToDynamicPage(pageId);
    });

    webSkel.registerAction("closeErrorModal", async (_target) => {
        closeModal(_target);
    });
    //registerAccountActions();
}

async function loadConfigs(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const config = await response.json();

        for (const service of config.services) {
            const ServiceModule = await import(service.path);
            webSkel.initialiseService(service.name, ServiceModule[service.name]);
        }
        for( const storageService of config.storageServices){
            const StorageServiceModule=await import(storageService.path);
            if(storageService.params) {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name](...Object.values(storageService.params)));
            } else {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
            }
        }
        storageManager.setCurrentService("FileSystemStorage");
        let result = await storageManager.loadSpace(currentSpaceId);
        webSkel.space = new Space(JSON.parse(result));
        await webSkel.getService("AuthenticationService").initUser();


        for (const presenter of config.presenters) {
            const PresenterModule = await import(presenter.path);
            webSkel.registerPresenter(presenter.name, PresenterModule[presenter.className]);
        }
        for (const component of config.components) {
            await webSkel.defineComponent(component.name, component.path);
        }


    } catch (error) {
        await showApplicationError("Error loading configs", "Error loading configs", `Encountered ${error} while trying loading webSkel configs`);
    }
}

(async ()=> {

    window.currentSpaceId = 1;
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    await initLiteUserDatabase();
    await loadConfigs("./wallet/webskel-configs.json");
    await loadPage();
    defineActions();
})();