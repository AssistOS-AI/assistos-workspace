import {
    chapterItem,
    addNewDocumentModal,
    showErrorModal,
    suggestAbstractModal,
    suggestTitleModal,
    documentsPage,
    docPageById,
    editTitlePage,
    editAbstractPage,
    proofReaderPage,
    settingsPage,
    brainstormingPage,
    documentSettingsPage,
    notBasePage,
    storageService,
    WebSkel, addRecord, closeModal,
    initUser, registerAccountActions,
    Company,
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
    // try {
    //     const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclave", "topSecret2");
    //     console.log("Client enclave: ", clientDIDDocument.getIdentifier());
    //     window.remoteEnclaveClientAccounting = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDIDAccounting);
    // }
    // catch (err) {
    //     console.log("Error at initialising remote client", err);
    // }
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

async function loadPage(){
    let url = window.location.hash;
    if(url === "" || url === null) {
        url = "#documents-page";
    }
    if(notBasePage(url)) {
        /*#proofReader, #documents */
        changeSelectedPageFromSidebar(url);
        await webSkel.changeToDynamicPage(url.slice(1));
    } else {
        /* URL examples: documents/0, documents/0/chapters/1 */
        switch(url.split('/')[0]) {
            case "#documents":
                let documentIdURL= parseInt(url.split('/')[1]);
                if(company.getDocument(documentIdURL) !== null) {
                    company.currentDocumentId = documentIdURL;
                    company.observeDocument(documentIdURL);
                    changeSelectedPageFromSidebar("documents-page");
                }
                changeSelectedPageFromSidebar("documents-page");
                break;
        }
        await webSkel.changeToStaticPage(url);
    }
}

async function initLiteUserDatabase(){
    webSkel.localStorage = await storageService.getInstance("freeUser",1);
    await webSkel.localStorage.initDatabase();
    /* TBD */
    window.currentCompanyId = 1;
    window.company = new Company(await webSkel.localStorage.getCompanyData(window.currentCompanyId));
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

function definePresenters(){
    webSkel.registerPresenter("chapter-item", chapterItem);

    webSkel.registerPresenter("doc-page-by-id", docPageById);
    webSkel.registerPresenter("edit-title-page", editTitlePage);
    webSkel.registerPresenter("edit-abstract-page", editAbstractPage);
    webSkel.registerPresenter("documents-page", documentsPage);
    webSkel.registerPresenter("document-settings-page", documentSettingsPage);
    webSkel.registerPresenter("brainstorming-page", brainstormingPage);
    webSkel.registerPresenter("proof-reader-page", proofReaderPage);
    webSkel.registerPresenter("settings-page", settingsPage);

    webSkel.registerPresenter("add-new-document-modal", addNewDocumentModal);
    webSkel.registerPresenter("show-error-modal", showErrorModal);
    webSkel.registerPresenter("suggest-abstract-modal", suggestAbstractModal);
    webSkel.registerPresenter("suggest-title-modal", suggestTitleModal);
}

function defineComponents() {
    /* Modal components defined here */
    webSkel.defineComponent("chapter-item", "./wallet/components/chapter-item/chapter-item.html");
    webSkel.defineComponent("company-item", "./wallet/components/company-item/company-item.html");
    webSkel.defineComponent("paragraph-item", "./wallet/components/paragraph-item/paragraph-item.html");
    webSkel.defineComponent("document-item-renderer", "./wallet/components/document-item-renderer/document-item-renderer.html");
    webSkel.defineComponent("action-box", "./wallet/components/action-box/action-box.html");
    webSkel.defineComponent("title-view", "./wallet/components/title-view/title-view.html");
    webSkel.defineComponent("title-edit", "./wallet/components/title-edit/title-edit.html");
    webSkel.defineComponent("action-box-with-select", "./wallet/components/action-box-with-select/action-box-with-select.html");
    webSkel.defineComponent("alternative-title-renderer", "./wallet/components/alternative-title-renderer/alternative-title-renderer.html");
    webSkel.defineComponent("alternative-abstract-renderer", "./wallet/components/alternative-abstract-renderer/alternative-abstract-renderer.html");

    webSkel.defineComponent("documents-page", "./wallet/pages/documents-page/documents-page.html");
    webSkel.defineComponent("document-settings-page", "./wallet/pages/document-settings-page/document-settings-page.html");
    webSkel.defineComponent("brainstorming-page", "./wallet/pages/brainstorming-page/brainstorming-page.html");
    webSkel.defineComponent("doc-page-by-id", "./wallet/pages/doc-page-by-id/doc-page-by-id.html");
    webSkel.defineComponent("edit-title-page", "./wallet/pages/edit-title-page/edit-title-page.html");
    webSkel.defineComponent("edit-abstract-page", "./wallet/pages/edit-abstract-page/edit-abstract-page.html");
    webSkel.defineComponent("proof-reader-page", "./wallet/pages/proof-reader-page/proof-reader-page.html");
    webSkel.defineComponent("settings-page", "./wallet/pages/settings-page/settings-page.html");

    webSkel.defineComponent("add-new-document-modal", "./wallet/components/add-new-document-modal/add-new-document-modal.html");
    webSkel.defineComponent("show-error-modal", "./wallet/components/show-error-modal/show-error-modal.html");
    webSkel.defineComponent("suggest-abstract-modal", "./wallet/components/suggest-abstract-modal/suggest-abstract-modal.html");
    webSkel.defineComponent("suggest-title-modal", "./wallet/components/suggest-title-modal/suggest-title-modal.html");
}

function defineActions(){
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

(async ()=> {
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    await initWallet();
     //initUser();
    if (('indexedDB' in window)) {
        await initLiteUserDatabase();
    } else {
        await showApplicationError("IndexDB not supported","Your current browser does not support local storage. Please use a different browser, or upgrade to premium","IndexDB is not supported by your browser");
    }
    await loadPage();
    await initEnclaveClient();

    defineActions();
    definePresenters();
    defineComponents();
})();