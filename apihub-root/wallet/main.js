import {
    llmsPage,
    personalitiesPage,
    documentsPage,
    docPageByTitle,
    editTitlePage,
    editAbstractPage,
    proofReaderPage,
    myOrganisationPage,
    urlForPage,
    closeModal,
    showActionBox,
    getClosestParentElement,
    liteUserDatabase,
    userDocument,
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

    let url = window.location.hash;
    if(url === "" || url === null) {
        url = "#documents-page";
    }
    if(!urlForPage(url)) {
        switch(url.split('/')[0]) {
            case "#documents":
                webSkel.currentDocumentId = "svd:document:" + url.split('/')[2];
                changeSelectedPageFromSidebar("documents-page");
                break;
        }
        await webSkel.changeToStaticPage(url);
    } else {
        changeSelectedPageFromSidebar(url);
        await webSkel.changeToDynamicPage(url.slice(1));
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
webSkel.setDomElementForPages(document.querySelector("#page-content"));

webSkel.registerPresenter("llms-page", llmsPage);
webSkel.registerPresenter("doc-page-by-title", docPageByTitle);
webSkel.registerPresenter("edit-title-page", editTitlePage);
webSkel.registerPresenter("edit-abstract-page", editAbstractPage);
webSkel.registerPresenter("personalities-page", personalitiesPage);
webSkel.registerPresenter("documents-page", documentsPage);
webSkel.registerPresenter("proof-reader-page", proofReaderPage);
webSkel.registerPresenter("my-organisation-page", myOrganisationPage);

webSkel.registerAction("closeModal", async (modal, _param) => {
    closeModal(modal);
});
webSkel.registerAction("addDocument",async(_target)=>{
    const formData=new FormData(getClosestParentElement(_target,'form'));
    let documentTitle= formData.get("documentTitle");
    let documentId= `dkey-${await webSkel.liteUserDB.addDocument(new userDocument(documentTitle))}`;
    closeModal(_target);
    const tableDocument=document.querySelector('.table');
    const newRowNode=document.createElement('document-item-renderer');
    newRowNode.setAttribute("data-name",documentTitle);
    newRowNode.setAttribute("data-primary-key",documentId);
    tableDocument.appendChild(newRowNode);
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

webSkel.registerAction("showActionBox", async (_target, primaryKey,componentName,insertionMode) => {
    await showActionBox(_target, primaryKey, componentName, insertionMode);
    let editButton = document.querySelector("[data-local-action='editAction']");
    if(editButton) {
        editButton.addEventListener("click", async (event) => {
            await webSkel.changeToStaticPage(`documents/${editButton.parentNode.parentNode.id}`);
        });
    }
    let deleteButton = document.querySelector("[data-local-action='deleteAction']");
    if (deleteButton) {
        deleteButton.addEventListener("click", async (event) => {
          getClosestParentElement(deleteButton,".document-item-renderer")?.remove();
    });

}});

/* Modal components defined here */
webSkel.defineComponent("add-llm-modal", "./wallet/components/add-llm-modal/add-llm-modal.html");
webSkel.defineComponent("add-personality-modal", "./wallet/components/add-personality-modal/add-personality-modal.html");
webSkel.defineComponent("add-announce-modal", "./wallet/components/add-announce-modal/add-announce-modal.html");
webSkel.defineComponent("add-new-document-modal", "./wallet/components/add-new-document-modal/add-new-document-modal.html");
webSkel.defineComponent("llm-item-renderer","./wallet/components/llm-item-renderer/llm-item-renderer.html");
webSkel.defineComponent("new-chapter", "./wallet/components/new-chapter/new-chapter.html");
webSkel.defineComponent("personality-item-renderer","./wallet/components/personality-item-renderer/personality-item-renderer.html");
webSkel.defineComponent("document-item-renderer","./wallet/components/document-item-renderer/document-item-renderer.html");
webSkel.defineComponent("action-box", "./wallet/components/action-box/action-box.html");
webSkel.defineComponent("action-box-with-select", "./wallet/components/action-box-with-select/action-box-with-select.html");
webSkel.defineComponent("alternative-title-renderer", "./wallet/components/alternative-title-renderer/alternative-title-renderer.html");
webSkel.defineComponent("alternative-abstract-renderer", "./wallet/components/alternative-abstract-renderer/alternative-abstract-renderer.html");

webSkel.defineComponent("llms-page", "./wallet/pages/llms-page/llms-page.html");
webSkel.defineComponent("personalities-page", "./wallet/pages/personalities-page/personalities-page.html");
webSkel.defineComponent("documents-page", "./wallet/pages/documents-page/documents-page.html");
webSkel.defineComponent("doc-page-by-title", "./wallet/pages/doc-page-by-title/doc-page-by-title.html");
webSkel.defineComponent("edit-title-page", "./wallet/pages/edit-title-page/edit-title-page.html");
webSkel.defineComponent("edit-abstract-page", "./wallet/pages/edit-abstract-page/edit-abstract-page.html");
webSkel.defineComponent("proof-reader-page", "./wallet/pages/proof-reader-page/proof-reader-page.html");
webSkel.defineComponent("my-organisation-page", "./wallet/pages/my-organisation-page/my-organisation-page.html");
async function initLiteUserDatabase(){
    webSkel.liteUserDB= new liteUserDatabase("liteUser",1);
    await webSkel.liteUserDB.init();
}
(async ()=> {
    await initWallet();
    await initEnclaveClient();
    if (('indexedDB' in window)) {
        await initLiteUserDatabase();
    }else{
        alert("Your current browser does not support local storage. Please use a different browser, or upgrade to premium");
    }
})();
