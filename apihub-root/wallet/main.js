import { llmsPage, showActionBox } from "./presenters/llms-page.js";
import { personalitiesPage } from "./presenters/personalities-page.js";
import { closeModal, showModal } from "./scripts/WebSkel/utils/modal-utils.js";
import WebSkel from "./scripts/WebSkel/webSkel.js";

const openDSU = require("opendsu");
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
    webSkel.changeToDynamicPage(url.slice(1));
}

window.webSkel = new WebSkel();

webSkel.setDomElementForPages(document.querySelector("#page-content"));

webSkel.registerPresenter("llms-page", llmsPage);
webSkel.registerPresenter("personalities-page", personalitiesPage);
// webSkel.registerAction("showAddLLMModal", async (...params) => {
//     await showModal(webSkel._documentElement, "add-llm-modal", {});
// })

webSkel.registerAction("closeModal", async (modal, _param) => {
    closeModal(modal);
});

webSkel.registerAction("showAddLLMModal", async (...params) => {
    await showModal(document.querySelector("body"), "add-llm-modal", {});
})

webSkel.registerAction("showAddPersonalityModal", async (...params) => {
    await showModal(document.querySelector("body"), "add-personality-modal", {});
})

webSkel.registerAction("changePage", async (_target, pageId) => {
    webSkel.currentToolId = pageId;
    await webSkel.changeToDynamicPage(pageId);
})
webSkel.registerAction("showActionBox", async (_target, primaryKey) => {
    showActionBox(primaryKey);
})

/* Modal components defined here */
webSkel.defineComponent("add-llm-modal", "../components/add-llm-modal/add-llm-modal.html");
webSkel.defineComponent("llm-item-renderer","../components/llm-item-renderer/llm-item-renderer.html");
webSkel.defineComponent("personality-item-renderer","../components/personality-item-renderer/personality-item-renderer.html");
webSkel.defineComponent("llms-page", "../pages/llms-page/llms-page.html");
webSkel.defineComponent("personalities-page", "../pages/personalities-page/personalities-page.html");

(async ()=>{
    await initWallet();
    await initEnclaveClient();
})();
