import {
    notBasePage,
    storageService,
    WebSkel,
    closeModal,
    initUser,
    Space,
} from "./imports.js";

const openDSU = require("opendsu");
window.webSkel = new WebSkel();
window.pageContent = document.querySelector("#page-content");
window.mainContent = document.querySelector("#main-content");
async function initEnclaveClient() {
    const w3cDID = openDSU.loadAPI("w3cdid");
    const enclaveAPI = openDSU.loadAPI("enclave");
    const remoteDID = "did:ssi:name:vault:BrandEnclave";
    const remoteDIDAccounting = "did:ssi:name:vault:AccountingEnclave";
    try {
        const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclave", "topSecret");
        console.log("Client enclave: ", clientDIDDocument.getIdentifier());
        window.remoteEnclaveClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDID);
    }
    catch (err) {
        console.log("Error at initialising remote client", err);
    }
    try {
        const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclave", "topSecret2");
        console.log("Client enclave: ", clientDIDDocument.getIdentifier());
        window.remoteEnclaveClientAccounting = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDIDAccounting);
    }
    catch (err) {
        console.log("Error at initialising remote client", err);
    }
}

async function initWallet() {
    if (rawDossier) {
        await $$.promisify(rawDossier.writeFile, rawDossier)("/environment.json", JSON.stringify({
            "vaultDomain": "vault",
            "didDomain": "vault",
            "enclaveType": "MemoryEnclave"
        }));
    }
    const sc = openDSU.loadAPI("sc").getSecurityContext();
    if (sc.isInitialised()) {
        await initEnclaveClient();
    }
    else {
        sc.on("initialised", initEnclaveClient.bind(this));
    }
}

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
                if (await webSkel.localStorage.getDocument(1, documentIdURL) !== null) {
                    webSkel.space.currentDocumentId = documentIdURL;
                    webSkel.space.currentChapterId = chapterIdURL;
                    webSkel.space.currentParagraphId = paragraphIdURL;
                    changeSelectedPageFromSidebar("documents-page");
                }
                changeSelectedPageFromSidebar("documents-page");
                break;
            }
            default:{
                webSkel.space.currentDocumentId=null;
                webSkel.space.currentChapterId = null;
                webSkel.space.currentParagraphId = null;
            }
        }
        await webSkel.changeToStaticPage(url);
    }
}

async function initLiteUserDatabase() {
    webSkel.localStorage = await storageService.getInstance("freeUser", 1);
    await webSkel.localStorage.initDatabase();
    let result = localStorage.getItem("currentUser");
    if(result) {
        window.currentSpaceId = JSON.parse(result).currentSpaceId;
    } else {
        window.currentSpaceId = 1;
    }
    webSkel.space = new Space(await webSkel.localStorage.getSpaceData(currentSpaceId));
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
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    /* only for premium users initWallet/enclaves*/
    //await initWallet();
    if (('indexedDB' in window)) {
        await initLiteUserDatabase();
    } else {
        await showApplicationError("IndexDB not supported", "Your current browser does not support local storage. Please use a different browser, or upgrade to premium", "IndexDB is not supported by your browser");
    }
    await initUser();
    await loadConfigs("./wallet/webskel-configs.json");
    await loadPage();
    defineActions();
})();