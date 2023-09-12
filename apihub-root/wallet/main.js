import {
    chapterItem,
    companyDropdown,
    addNewDocumentModal,
    addAnnounceModal,
    addIdeaModal,
    addLLMModal,
    addPersonalityModal,
    addUserModal,
    suggestAbstractModal,
    suggestTitleModal,
    documentsPage,
    docPageById,
    editTitlePage,
    editAbstractPage,
    chapterTitlePage,
    chapterBrainstormingPage,
    proofReaderPage,
    myOrganizationPage,
    brainstormingPage,
    documentSettingsPage,
    announcesPage,
    usersPage,
    personalitiesPage,
    llmsPage,
    notBasePage,
    storageService,
    WebSkel, addRecord, closeModal,
    initUser, registerAccountActions,
    Company, documentService, llmsService, personalitiesService, settingsService, chapterService, usersService
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
                let chapterIdURL = parseInt(url.split('/')[3]);
                /* To be replaced with company id from URL */
                if(await webSkel.localStorage.getDocument(1, documentIdURL) !== null) {
                    webSkel.company.currentDocumentId = documentIdURL;
                    webSkel.company.currentChapterId = chapterIdURL;
                    changeSelectedPageFromSidebar("documents-page");
                }
                changeSelectedPageFromSidebar("documents-page");
                break;
        }
        await webSkel.changeToStaticPage(url);
    }
}

async function initLiteUserDatabase() {
    webSkel.localStorage = await storageService.getInstance("freeUser", 1);
    await webSkel.localStorage.initDatabase();
    let result = localStorage.getItem("currentUser");
    if(result) {
        window.currentCompanyId = JSON.parse(result).currentCompanyId;
    } else {
        window.currentCompanyId = 1;
    }
    webSkel.company = new Company(await webSkel.localStorage.getCompanyData(currentCompanyId));
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

function definePresenters() {
    webSkel.registerPresenter("chapter-item", chapterItem);
    webSkel.registerPresenter("company-dropdown", companyDropdown);

    webSkel.registerPresenter("doc-page-by-id", docPageById);
    webSkel.registerPresenter("edit-title-page", editTitlePage);
    webSkel.registerPresenter("edit-abstract-page", editAbstractPage);
    webSkel.registerPresenter("documents-page", documentsPage);
    webSkel.registerPresenter("document-settings-page", documentSettingsPage);
    webSkel.registerPresenter("brainstorming-page", brainstormingPage);
    webSkel.registerPresenter("chapter-brainstorming-page", chapterBrainstormingPage);
    webSkel.registerPresenter("chapter-title-page", chapterTitlePage);
    webSkel.registerPresenter("proof-reader-page", proofReaderPage);
    webSkel.registerPresenter("my-organization-page", myOrganizationPage);

    webSkel.registerPresenter("announces-page", announcesPage);
    webSkel.registerPresenter("llms-page", llmsPage);
    webSkel.registerPresenter("users-page", usersPage);
    webSkel.registerPresenter("personalities-page", personalitiesPage);

    webSkel.registerPresenter("add-new-document-modal", addNewDocumentModal);
    webSkel.registerPresenter("add-announce-modal", addAnnounceModal);
    webSkel.registerPresenter("add-idea-modal", addIdeaModal);
    webSkel.registerPresenter("add-llm-modal", addLLMModal);
    webSkel.registerPresenter("add-personality-modal", addPersonalityModal);
    webSkel.registerPresenter("add-user-modal", addUserModal);
    webSkel.registerPresenter("suggest-abstract-modal", suggestAbstractModal);
    webSkel.registerPresenter("suggest-title-modal", suggestTitleModal);
}

function defineServices() {
    webSkel.registerService("documentService", documentService);
    webSkel.registerService("chapterService", chapterService);
    webSkel.registerService("llmsService", llmsService);
    webSkel.registerService("personalitiesService", personalitiesService);
    webSkel.registerService("usersService", usersService);
    webSkel.registerService("settingsService", settingsService);
    webSkel.registerService("currentCompany", Company);
}

function defineComponents() {
    /* Modal components defined here */
    webSkel.defineComponent("chapter-item", "./wallet/components/items/chapter-item/chapter-item.html");
    webSkel.defineComponent("company-dropdown", "./wallet/components/company-dropdown/company-dropdown.html");
    webSkel.defineComponent("company-item", "./wallet/components/items/company-item/company-item.html");
    webSkel.defineComponent("paragraph-item", "./wallet/components/items/paragraph-item/paragraph-item.html");
    webSkel.defineComponent("document-item-renderer", "./wallet/components/items/document-item-renderer/document-item-renderer.html");
    webSkel.defineComponent("llm-item-renderer", "./wallet/components/items/llm-item-renderer/llm-item-renderer.html");
    webSkel.defineComponent("personality-item-renderer", "./wallet/components/items/personality-item-renderer/personality-item-renderer.html");
    webSkel.defineComponent("user-item-renderer", "./wallet/components/items/user-item-renderer/user-item-renderer.html");
    webSkel.defineComponent("announce-renderer", "./wallet/components/items/announce-renderer/announce-renderer.html");
    webSkel.defineComponent("action-box", "./wallet/components/action-box/action-box.html");
    webSkel.defineComponent("title-view", "./wallet/components/title-view/title-view.html");
    webSkel.defineComponent("title-edit", "./wallet/components/title-edit/title-edit.html");
    webSkel.defineComponent("action-box-with-select", "./wallet/components/action-box-with-select/action-box-with-select.html");
    webSkel.defineComponent("alternative-title-renderer", "./wallet/components/items/alternative-title-renderer/alternative-title-renderer.html");
    webSkel.defineComponent("alternative-abstract-renderer", "./wallet/components/items/alternative-abstract-renderer/alternative-abstract-renderer.html");

    webSkel.defineComponent("documents-page", "./wallet/pages/documents-page/documents-page.html");
    webSkel.defineComponent("document-settings-page", "./wallet/pages/document-settings-page/document-settings-page.html");
    webSkel.defineComponent("brainstorming-page", "./wallet/pages/brainstorming-page/brainstorming-page.html");
    webSkel.defineComponent("chapter-brainstorming-page", "./wallet/pages/chapter-brainstorming-page/chapter-brainstorming-page.html");
    webSkel.defineComponent("chapter-title-page", "./wallet/pages/chapter-title-page/chapter-title-page.html");
    webSkel.defineComponent("doc-page-by-id", "./wallet/pages/doc-page-by-id/doc-page-by-id.html");
    webSkel.defineComponent("edit-title-page", "./wallet/pages/edit-title-page/edit-title-page.html");
    webSkel.defineComponent("edit-abstract-page", "./wallet/pages/edit-abstract-page/edit-abstract-page.html");
    webSkel.defineComponent("proof-reader-page", "./wallet/pages/proof-reader-page/proof-reader-page.html");
    webSkel.defineComponent("my-organization-page", "./wallet/pages/my-organization-page/my-organization-page.html");

    webSkel.defineComponent("llms-page", "./wallet/pages/llms-page/llms-page.html");
    webSkel.defineComponent("announces-page", "./wallet/pages/announces-page/announces-page.html");
    webSkel.defineComponent("users-page", "./wallet/pages/users-page/users-page.html");
    webSkel.defineComponent("personalities-page", "./wallet/pages/personalities-page/personalities-page.html");

    webSkel.defineComponent("add-new-document-modal", "./wallet/components/modals/add-new-document-modal/add-new-document-modal.html");
    webSkel.defineComponent("add-announce-modal", "./wallet/components/modals/add-announce-modal/add-announce-modal.html");
    webSkel.defineComponent("add-idea-modal", "./wallet/components/modals/add-idea-modal/add-idea-modal.html");
    webSkel.defineComponent("add-llm-modal", "./wallet/components/modals/add-llm-modal/add-llm-modal.html");
    webSkel.defineComponent("add-personality-modal", "./wallet/components/modals/add-personality-modal/add-personality-modal.html");
    webSkel.defineComponent("add-user-modal", "./wallet/components/modals/add-user-modal/add-user-modal.html");
    webSkel.defineComponent("show-error-modal", "./wallet/components/modals/show-error-modal/show-error-modal.html");
    webSkel.defineComponent("suggest-abstract-modal", "./wallet/components/modals/suggest-abstract-modal/suggest-abstract-modal.html");
    webSkel.defineComponent("suggest-title-modal", "./wallet/components/modals/suggest-title-modal/suggest-title-modal.html");
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
    /* only for premium users initWallet/enclaves*/
    //await initWallet();
    window.changeCompany = (companyId) => {
        window.currentCompanyId = companyId;
        let user = JSON.parse(localStorage.getItem("currentUser"));
        user.currentCompanyId = currentCompanyId;
        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location = "";
    }
    if (('indexedDB' in window)) {
        await initLiteUserDatabase();
    } else {
        await showApplicationError("IndexDB not supported","Your current browser does not support local storage. Please use a different browser, or upgrade to premium","IndexDB is not supported by your browser");
    }
    await initUser();
    await loadPage();

    defineActions();
    definePresenters();
    defineServices();
    defineComponents();
})();