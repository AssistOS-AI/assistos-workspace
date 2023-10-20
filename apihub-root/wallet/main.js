import {
    WebSkel,
    closeModal,
} from "./imports.js";
import { StorageManager } from "./core/services/storageManager.js";
import {DocumentFactory} from "./core/factories/documentFactory.js";

window.webSkel = new WebSkel();
window.mainContent = document.querySelector("#app-wrapper");

async function loadPage() {
    let url = window.location.hash;
    if(url === "" || url === null) {
        url = "#space-page";
    }
    let presenterName;
        /* URL examples: documents/0, documents/0/chapters/1 */
        switch(url.split('/')[0]) {
            case "#documents": {
                /* custom getURlParams func*/
                let documentIdURL = url.split('/')[1];
                presenterName = url.split('/')[2];
                let chapterIdURL = url.split('/')[3];
                let paragraphIdURL = url.split('/')[4];
                /* To be replaced with space id from URL */
                if (await storageManager.loadObject(currentSpaceId, "documents", documentIdURL) !== null) {
                    webSkel.space.currentDocumentId = documentIdURL;
                    webSkel.space.currentChapterId = chapterIdURL;
                    webSkel.space.currentParagraphId = paragraphIdURL;
                }
                changeSelectedPageFromSidebar("documents-page");
                break;
            }
            case "#authentication-page":{
                changeSelectedPageFromSidebar(url);
                presenterName = url.slice(1);
                break;
            }
            default: {
                /*#proofReader, #documents */
                changeSelectedPageFromSidebar(url);
                presenterName = url.slice(1);
                webSkel.space.currentDocumentId = null;
                webSkel.space.currentChapterId = null;
                webSkel.space.currentParagraphId = null;
                break;
            }
        }
        await webSkel.changeToDynamicPage(presenterName, url.slice(1));

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
        await webSkel.changeToDynamicPage(pageId, pageId);
    });

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
        for( const storageService of config.storageServices){
            const StorageServiceModule=await import(storageService.path);
            if(storageService.params) {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name](...Object.values(storageService.params)));
            } else {
                storageManager.addStorageService(storageService.name, new StorageServiceModule[storageService.name]());
            }
        }

        storageManager.setCurrentService("FileSystemStorage");
        await webSkel.getService("AuthenticationService").initUser();

        for (const presenter of config.presenters) {
            const PresenterModule = await import(presenter.path);
            webSkel.registerPresenter(presenter.name, PresenterModule[presenter.className]);
        }
        for (const component of config.components) {
            await webSkel.defineComponent(component.name, component.path);
        }

    } catch (error) {
        console.error(error);
        await showApplicationError("Error loading configs", "Error loading configs", `Encountered ${error} while trying loading webSkel configs`);
    }
}

(async ()=> {
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    window.storageManager = new StorageManager();
    window.documentFactory = new DocumentFactory();
    await loadConfigs("./wallet/webskel-configs.json");
    await loadPage();
    defineActions();
})();