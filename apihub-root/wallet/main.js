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
    brainstormingPage,
    documentSettingsPage,
    notBasePage,
    storageService,
    Registry,
    WebSkel, addRecord, closeModal
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
                let documentIdURL= parseInt(url.split('/')[1]);
                if(webSkel.registry.getDocument(documentIdURL) !== null) {
                    webSkel.registry.currentDocumentId = documentIdURL;
                    webSkel.registry.observeDocument(documentIdURL);
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
    webSkel.registry = Registry.getInstance(await webSkel.localStorage.getAllData());
    if(webSkel.registry.getAllDocuments().length === 0) {
        const randomNumber= Math.floor(Math.random() * 1000000);
        await webSkel.registry.addDocument(
        {
            name: `test${randomNumber}`,
            abstract: "Lorem ipsum dolor sit amet, usu at facilis mandamus periculis. Ut aeterno forensibus nec, mea animal utamur in. In option regione temporibus sea, duo insolens hendrerit ex. Harum deleniti recusabo mea an, duo dicant deseruisse disputationi te, ei mei quot offendit. Eum vero minim virtute ex, ne tale porro vel. Eum te graecis phaedrum corrumpit, melius facilis perfecto qui te, ut eam iusto disputando. Ne lorem consetetur vim.",
            chapters: [
                {
                    title: "Chapter 1",
                    id: 1,
                    paragraphs: [
                        {
                            text: "Lorem ipsum dolor sit amet, usu eu illud oratio, at populo doming usu, error appareat argumentum sit ei. Epicurei pertinax no eam, te enim lucilius est. Sit erat integre lobortis te. In sit integre graecis intellegam. Aperiam nostrud mediocritatem qui no, te duo nulla noluisse.",
                            id: 1
                        },
                        {
                            text: "Eu quo solum persius persecuti, ei mei hinc iriure voluptaria. Odio definitionem delicatissimi mei te, sed at debet suscipiantur, praesent accusamus consulatu per cu. Soluta posidonium vix ad, ut dolore postea doming vix. Etiam possim periculis at pro, pri case causae expetendis ea.",
                            id: 2
                        }
                    ]
                },
                {
                    title: "Chapter 2",
                    id: 2,
                    paragraphs: [
                        {
                            text: "Has ex omnium referrentur. Audire concludaturque no vel, mundi minimum mea ei, gloriatur disputando vel eu. Nec ei graecis placerat. Enim idque gubergren ex per, sea illum inciderint cu. Et regione percipit adolescens vix.",
                            id: 1
                        },
                        {
                            text: "At eos saepe torquatos, pro ullum appellantur eu. Semper iisque eam cu, pri an quando epicuri, cu eum eros minim delenit. Est in docendi omnesque, et his quod habeo nonumes, iudico facilis habemus duo cu. Duo justo vituperata ea, pri facete fastidii praesent cu. Cu cum habemus dissentias, iudico equidem nominati eam in.",
                            id: 2
                        }
                    ]
                },
                {
                    title: "Chapter 3",
                    id: 3,
                    paragraphs: [
                        {
                            text: "Ea pro causae bonorum erroribus. Eu est tempor dictas ullamcorper. Et apeirian intellegat vel, in pri percipit scribentur liberavisse. No has sonet detracto albucius, aeque graece minimum mea ut.",
                            id: 1
                        },
                        {
                            text: "Ea elitr laoreet accusata eum. Partem graecis est in, cu est mazim viderer eloquentiam, at harum democritum qui. Facilisi efficiantur sit ad, vim prima debitis et. Novum perpetua cum id, duo eu porro cetero postulant, et eos congue evertitur.",
                            id: 2
                        }
                    ]
                }
            ], settings: {}
        });
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

function definePresenters(){
    webSkel.registerPresenter("chapter-item", chapterItem);

    webSkel.registerPresenter("doc-page-by-id", docPageById);
    webSkel.registerPresenter("edit-title-page", editTitlePage);
    webSkel.registerPresenter("edit-abstract-page", editAbstractPage);
    webSkel.registerPresenter("documents-page", documentsPage);
    webSkel.registerPresenter("document-settings-page", documentSettingsPage);
    webSkel.registerPresenter("brainstorming-page", brainstormingPage);
    webSkel.registerPresenter("proof-reader-page", proofReaderPage);

    webSkel.registerPresenter("add-new-document-modal", addNewDocumentModal);
    webSkel.registerPresenter("show-error-modal", showErrorModal);
    webSkel.registerPresenter("suggest-abstract-modal", suggestAbstractModal);
    webSkel.registerPresenter("suggest-title-modal", suggestTitleModal);
}

function defineComponents() {
    /* Modal components defined here */
    webSkel.defineComponent("chapter-item", "./wallet/components/chapter-item/chapter-item.html");
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
}

(async ()=> {
    webSkel.setDomElementForPages(document.querySelector("#page-content"));
    await initWallet();
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