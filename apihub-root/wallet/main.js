import { llmsPage } from "./presenters/llms-page.js";
import { personalitiesPage } from "./presenters/personalities-page.js";
import { documentsPage } from "./presenters/documents-page.js";
import { docPageByTitle } from "./presenters/doc-page-by-title.js";
import { proofReaderPage } from "./presenters/proof-reader-page.js";
import { myOrganisationPage } from "./presenters/my-organisation-page.js";
import { closeModal, showActionBox } from "../WebSkel/utils/modal-utils.js";
import WebSkel from "../WebSkel/webSkel.js";

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
        console.log(`i m here with url=${url}`);
        switch(url.split('/')[1]) {
            case "documents-page":
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
webSkel.registerPresenter("personalities-page", personalitiesPage);
webSkel.registerPresenter("documents-page", documentsPage);
webSkel.registerPresenter("proof-reader-page", proofReaderPage);
webSkel.registerPresenter("my-organisation-page", myOrganisationPage);

webSkel.registerAction("closeModal", async (modal, _param) => {
    closeModal(modal);
});

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
    editButton.addEventListener("click", async (event) => {
        console.log(editButton.parentNode.parentNode.id);
        await webSkel.changeToStaticPage(`documents/${editButton.parentNode.parentNode.id}`);
    });
})

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

webSkel.defineComponent("llms-page", "./wallet/pages/llms-page/llms-page.html");
webSkel.defineComponent("personalities-page", "./wallet/pages/personalities-page/personalities-page.html");
webSkel.defineComponent("documents-page", "./wallet/pages/documents-page/documents-page.html");
webSkel.defineComponent("doc-page-by-title", "./wallet/pages/doc-page-by-title/doc-page-by-title.html");
webSkel.defineComponent("proof-reader-page", "./wallet/pages/proof-reader-page/proof-reader-page.html");
webSkel.defineComponent("my-organisation-page", "./wallet/pages/my-organisation-page/my-organisation-page.html");

(async ()=> {
    await initWallet();
    await initEnclaveClient();
})();

function urlForPage(url) {
    let count = 0;
    for (let i = 0; i < url.length; i++) {
        if (url[i] === '/') {
            count++;
        }
    }
    return !(count > 2 || (count === 2 && url[url.length - 1] !== '/'));
}