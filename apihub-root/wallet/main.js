import {
    chapterUnit,
    companyDropdown,
    addDocumentModal,
    addAnnouncementModal,
    addChapterModal,
    addLLMModal,
    addPersonalityModal,
    addUserModal,
    suggestAbstractModal,
    suggestTitlesModal,
    documentsPage,
    documentViewPage,
    editTitlePage,
    editAbstractPage,
    chapterTitlePage,
    chapterBrainstormingPage,
    paragraphBrainstormingPage,
    paragraphProofreadPage,
    proofReaderPage,
    myOrganizationPage,
    brainstormingPage,
    documentSettingsPage,
    announcementsPage,
    usersPage,
    personalitiesPage,
    llmsPage,
    notBasePage,
    storageService,
    WebSkel,
    addRecord,
    closeModal,
    addCompanyModal,
    initUser,
    registerAccountActions,
    Company,
    documentService,
    llmsService,
    personalitiesService,
    settingsService,
    chapterService,
    usersService,
    companyService
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
                let paragraphIdURL = parseInt(url.split('/')[4]);
                /* To be replaced with company id from URL */
                if(await webSkel.localStorage.getDocument(1, documentIdURL) !== null) {
                    webSkel.company.currentDocumentId = documentIdURL;
                    webSkel.company.currentChapterId = chapterIdURL;
                    webSkel.company.currentParagraphId = paragraphIdURL;
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
    webSkel.registerPresenter("chapter-unit", chapterUnit);
    webSkel.registerPresenter("company-dropdown", companyDropdown);

    webSkel.registerPresenter("document-view-page", documentViewPage);
    webSkel.registerPresenter("edit-title-page", editTitlePage);
    webSkel.registerPresenter("edit-abstract-page", editAbstractPage);
    webSkel.registerPresenter("documents-page", documentsPage);
    webSkel.registerPresenter("document-settings-page", documentSettingsPage);
    webSkel.registerPresenter("brainstorming-page", brainstormingPage);
    webSkel.registerPresenter("chapter-brainstorming-page", chapterBrainstormingPage);
    webSkel.registerPresenter("paragraph-brainstorming-page", paragraphBrainstormingPage);
    webSkel.registerPresenter("paragraph-proofread-page", paragraphProofreadPage);
    webSkel.registerPresenter("chapter-title-page", chapterTitlePage);
    webSkel.registerPresenter("proof-reader-page", proofReaderPage);
    webSkel.registerPresenter("my-organization-page", myOrganizationPage);

    webSkel.registerPresenter("announcements-page", announcementsPage);
    webSkel.registerPresenter("llms-page", llmsPage);
    webSkel.registerPresenter("users-page", usersPage);
    webSkel.registerPresenter("personalities-page", personalitiesPage);

    webSkel.registerPresenter("add-document-modal", addDocumentModal);
    webSkel.registerPresenter("add-announcement-modal", addAnnouncementModal);
    webSkel.registerPresenter("add-chapter-modal", addChapterModal);
    webSkel.registerPresenter("add-llm-modal", addLLMModal);
    webSkel.registerPresenter("add-personality-modal", addPersonalityModal);
    webSkel.registerPresenter("add-user-modal", addUserModal);
    webSkel.registerPresenter("suggest-abstract-modal", suggestAbstractModal);
    webSkel.registerPresenter("suggest-titles-modal", suggestTitlesModal);
    webSkel.registerPresenter("add-company-modal", addCompanyModal);
}

function defineServices() {
    webSkel.initialiseService("documentService",  new documentService());
    webSkel.initialiseService("chapterService", new chapterService());
    webSkel.initialiseService("llmsService", new llmsService());
    webSkel.initialiseService("personalitiesService", new personalitiesService());
    webSkel.initialiseService("usersService", new usersService());
    webSkel.initialiseService("settingsService", new settingsService());
    webSkel.initialiseService("currentCompany", new Company());
    webSkel.initialiseService("companyService", new companyService());
}

function defineComponents() {
    /* Modal components defined here */
    webSkel.defineComponent("chapter-unit", "./wallet/web-components/components/item-list/chapter-unit/chapter-unit.html");
    webSkel.defineComponent("company-dropdown", "./wallet/web-components/components/company-dropdown/company-dropdown.html");
    webSkel.defineComponent("company-unit", "./wallet/web-components/components/item-list/company-unit/company-unit.html");
    webSkel.defineComponent("paragraph-unit", "./wallet/web-components/components/item-list/paragraph-unit/paragraph-unit.html");
    webSkel.defineComponent("document-unit", "./wallet/web-components/components/item-list/document-unit/document-unit.html");
    webSkel.defineComponent("llm-unit", "./wallet/web-components/components/item-list/llm-unit/llm-unit.html");
    webSkel.defineComponent("personality-unit", "./wallet/web-components/components/item-list/personality-unit/personality-unit.html");
    webSkel.defineComponent("user-unit", "./wallet/web-components/components/item-list/user-unit/user-unit.html");
    webSkel.defineComponent("announcement-unit", "./wallet/web-components/components/item-list/announcement-unit/announcement-unit.html");
    webSkel.defineComponent("brainstorming-chapter-unit", "./wallet/web-components/components/item-list/brainstorming-chapter-unit/brainstorming-chapter-unit.html");
    webSkel.defineComponent("brainstorming-document-idea", "./wallet/web-components/components/item-list/brainstorming-document-idea/brainstorming-document-idea.html");
    webSkel.defineComponent("action-box", "./wallet/web-components/components/action-box/action-box.html");
    webSkel.defineComponent("title-view", "./wallet/web-components/components/title-view/title-view.html");
    webSkel.defineComponent("title-edit", "./wallet/web-components/components/title-edit/title-edit.html");
    webSkel.defineComponent("action-box-with-select", "./wallet/web-components/components/action-box-with-select/action-box-with-select.html");
    webSkel.defineComponent("alternative-title", "./wallet/web-components/components/item-list/alternative-title/alternative-title.html");
    webSkel.defineComponent("alternative-abstract", "./wallet/web-components/components/item-list/alternative-abstract/alternative-abstract.html");

    webSkel.defineComponent("documents-page", "./wallet/web-components/pages/documents-page/documents-page.html");
    webSkel.defineComponent("document-settings-page", "./wallet/web-components/pages/document-settings-page/document-settings-page.html");
    webSkel.defineComponent("brainstorming-page", "./wallet/web-components/pages/brainstorming-page/brainstorming-page.html");
    webSkel.defineComponent("chapter-brainstorming-page", "./wallet/web-components/pages/chapter-brainstorming-page/chapter-brainstorming-page.html");
    webSkel.defineComponent("paragraph-brainstorming-page", "./wallet/web-components/pages/paragraph-brainstorming-page/paragraph-brainstorming-page.html");
    webSkel.defineComponent("paragraph-proofread-page", "./wallet/web-components/pages/paragraph-proofread-page/paragraph-proofread-page.html");
    webSkel.defineComponent("chapter-title-page", "./wallet/web-components/pages/chapter-title-page/chapter-title-page.html");
    webSkel.defineComponent("document-view-page", "./wallet/web-components/pages/document-view-page/document-view-page.html");
    webSkel.defineComponent("edit-title-page", "./wallet/web-components/pages/edit-title-page/edit-title-page.html");
    webSkel.defineComponent("edit-abstract-page", "./wallet/web-components/pages/edit-abstract-page/edit-abstract-page.html");
    webSkel.defineComponent("proof-reader-page", "./wallet/web-components/pages/proof-reader-page/proof-reader-page.html");
    webSkel.defineComponent("my-organization-page", "./wallet/web-components/pages/my-organization-page/my-organization-page.html");

    webSkel.defineComponent("llms-page", "./wallet/web-components/subpages/llms-page/llms-page.html");
    webSkel.defineComponent("announcements-page", "./wallet/web-components/subpages/announcements-page/announcements-page.html");
    webSkel.defineComponent("users-page", "./wallet/web-components/subpages/users-page/users-page.html");
    webSkel.defineComponent("personalities-page", "./wallet/web-components/subpages/personalities-page/personalities-page.html");

    webSkel.defineComponent("add-document-modal", "./wallet/web-components/modals/add-document-modal/add-document-modal.html");
    webSkel.defineComponent("add-announcement-modal", "./wallet/web-components/modals/add-announcement-modal/add-announcement-modal.html");
    webSkel.defineComponent("add-chapter-modal", "./wallet/web-components/modals/add-chapter-modal/add-chapter-modal.html");
    webSkel.defineComponent("add-llm-modal", "./wallet/web-components/modals/add-llm-modal/add-llm-modal.html");
    webSkel.defineComponent("add-personality-modal", "./wallet/web-components/modals/add-personality-modal/add-personality-modal.html");
    webSkel.defineComponent("add-user-modal", "./wallet/web-components/modals/add-user-modal/add-user-modal.html");
    webSkel.defineComponent("show-error-modal", "./wallet/web-components/modals/show-error-modal/show-error-modal.html");
    webSkel.defineComponent("suggest-abstract-modal", "./wallet/web-components/modals/suggest-abstract-modal/suggest-abstract-modal.html");
    webSkel.defineComponent("suggest-titles-modal", "./wallet/web-components/modals/suggest-titles-modal/suggest-titles-modal.html");
    webSkel.defineComponent("add-company-modal","./wallet/web-components/modals/add-company-modal/add-company-modal.html");
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
        await showApplicationError("IndexDB not supported", "Your current browser does not support local storage. Please use a different browser, or upgrade to premium", "IndexDB is not supported by your browser");
    }
    await initUser();
    await loadPage();

    defineActions();
    definePresenters();
    defineServices();
    defineComponents();
})();