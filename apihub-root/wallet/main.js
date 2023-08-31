import {
    documentsPage,
    docPageByTitle,
    editTitlePage,
    editAbstractPage,
    proofReaderPage,
    brainstormingPage,
    documentSettingsPage,
    addNewDocumentModal,
    notBasePage,
    closeModal,
    showActionBox,
    getClosestParentElement,
    localStorage,
    Document,
    Company,
    showModal,
    Registry,
    WebSkel
} from "./imports.js";


const openDSU = require("opendsu");
window.webSkel = new WebSkel();
async function initEnclaveClient() {
    const w3cDID = openDSU.loadAPI("w3cdid");
    const enclaveAPI = openDSU.loadAPI("enclave");
    const remoteDID = "did:ssi:name:vault:BrandEnclave";
    try {
        const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclave", "topSecret");
        console.log("Client enclave: ", clientDIDDocument.getIdentifier());
        window.remoteEnclaveClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDID);
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
                webSkel.registry.currentDocumentId = parseInt(url.split('/')[1]);
                changeSelectedPageFromSidebar("documents-page");
                break;
        }
        await webSkel.changeToStaticPage(url);
    }
}

async function initLiteUserDatabase(){
    webSkel.localStorage= await localStorage.getInstance("freeUser",1);
    await webSkel.localStorage.initDatabase();
    webSkel.registry = Registry.getInstance(await webSkel.localStorage.getAllData());
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
    webSkel.registerPresenter("doc-page-by-title", docPageByTitle);
    webSkel.registerPresenter("edit-title-page", editTitlePage);
    webSkel.registerPresenter("edit-abstract-page", editAbstractPage);
    webSkel.registerPresenter("documents-page", documentsPage);
    webSkel.registerPresenter("document-settings-page", documentSettingsPage);
    webSkel.registerPresenter("brainstorming-page", brainstormingPage);
    webSkel.registerPresenter("proof-reader-page", proofReaderPage);

    webSkel.registerPresenter("add-new-document-modal", addNewDocumentModal);
}

function defineComponents() {
    /* Modal components defined here */
    webSkel.defineComponent("chapter-item", "./wallet/components/chapter-item/chapter-item.html");
    webSkel.defineComponent("document-item-renderer", "./wallet/components/document-item-renderer/document-item-renderer.html");
    webSkel.defineComponent("action-box", "./wallet/components/action-box/action-box.html");
    webSkel.defineComponent("action-box-with-select", "./wallet/components/action-box-with-select/action-box-with-select.html");
    webSkel.defineComponent("alternative-title-renderer", "./wallet/components/alternative-title-renderer/alternative-title-renderer.html");
    webSkel.defineComponent("alternative-abstract-renderer", "./wallet/components/alternative-abstract-renderer/alternative-abstract-renderer.html");
    webSkel.defineComponent("suggest-title-modal", "./wallet/components/suggest-title-modal/suggest-title-modal.html");
    webSkel.defineComponent("suggest-abstract-modal", "./wallet/components/suggest-abstract-modal/suggest-abstract-modal.html");
    webSkel.defineComponent("show-error-modal","/wallet/components/show-error-modal/show-error-modal.html")

    webSkel.defineComponent("documents-page", "./wallet/pages/documents-page/documents-page.html");
    webSkel.defineComponent("document-settings-page", "./wallet/pages/document-settings-page/document-settings-page.html");
    webSkel.defineComponent("brainstorming-page", "./wallet/pages/brainstorming-page/brainstorming-page.html");
    webSkel.defineComponent("doc-page-by-title", "./wallet/pages/doc-page-by-title/doc-page-by-title.html");
    webSkel.defineComponent("edit-title-page", "./wallet/pages/edit-title-page/edit-title-page.html");
    webSkel.defineComponent("edit-abstract-page", "./wallet/pages/edit-abstract-page/edit-abstract-page.html");
    webSkel.defineComponent("proof-reader-page", "./wallet/pages/proof-reader-page/proof-reader-page.html");

    webSkel.defineComponent("add-new-document-modal", "./wallet/components/add-new-document-modal/add-new-document-modal.html");
}
function defineActions(){
    webSkel.registerAction("closeModal", async (modal, _param) => {
        closeModal(modal);
    });

    webSkel.registerAction("closeErrorModal", (modal)=>{
        closeModal(modal);
        // window.location="/";
    });
    webSkel.registerAction("addDocument",async(_target)=>{
        let documentTitle= new FormData(getClosestParentElement(_target,'form')).get("documentTitle");
        let documentObj= new Document(documentTitle);
        documentObj.id=await webSkel.localStorage.addDocument(documentObj);
        closeModal(_target);
        let currentCompany = Company.getInstance();
        currentCompany.companyState.documents.push(documentObj);
        currentCompany.notifyObservers();
    })

    webSkel.registerAction("changePage", async (_target, pageId,refreshFlag='0') => {
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
    })

    ///!!!DE FACUT CU DATA-LOCAL-ACTION
    webSkel.registerAction("showActionBox", async (_target, primaryKey, componentName, insertionMode) => {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    });
}

(async ()=> {
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    await initWallet();
    if (('indexedDB' in window)) {
        await initLiteUserDatabase();
    } else {
        alert("Your current browser does not support local storage. Please use a different browser, or upgrade to premium");
    }
    await loadPage();
    await initEnclaveClient();

    defineActions();
    definePresenters();
    defineComponents();
})();
