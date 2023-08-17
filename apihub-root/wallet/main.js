import {llmsPage, showActionBox} from "./presenters/llms-page.js";

import WebSkel from "./scripts/WebSkel/webSkel.js";
import {closeModal, showModal} from "./scripts/WebSkel/utils/modal-utils.js";
const openDSU = require("opendsu");

const manager= new WebSkel();
window.webSkel = manager;
webSkel.setDomElementForPages(document.querySelector("#page-content"));

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
    //webSkel.changeToStaticPage("");
}

await initWallet();
await initEnclaveClient();

webSkel.registerPresenter("llms-page", llmsPage);

webSkel.registerAction("showAddLLMModal", async (...params) => {
    await showModal(webSkel._documentElement, "add-llm-modal", {});
})

webSkel.registerAction("closeModal", async (modal, _param) => {
    closeModal(modal);
});

webSkel.registerAction("changePage", async (_target, pageId) => {
    webSkel.currentToolId = pageId;
    await webSkel.changeToDynamicPage(pageId);
})
webSkel.registerAction("showActionBox", async (_target, primaryKey) => {
    showActionBox(primaryKey);
})


// Modal components defined here
webSkel.defineComponent("add-llm-modal", "/components/add-llm-modal/add-llm-modal.html");
webSkel.defineComponent("llm-item-renderer","../components/llm-item-renderer/llm-item-renderer.html");
// defineComponent("llm-item-renderer", "/components/llm-item-renderer/llm-item-renderer.html");
webSkel.defineComponent("llms-page", "../pages/llms-page/llms-page.html");
