import { llmsPage } from "./presenters/llms-page.js";
window.appManager.registerPresenter("llms-page", llmsPage);


async initEnclaveClient() {
    const w3cDID = openDSU.loadAPI("w3cdid");

    const enclaveAPI = openDSU.loadAPI("enclave");
    const remoteDID = "did:ssi:name:vault:BrandEnclave";

    try {
        const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclave", "topSecret");
        console.log("Client enclave: ", clientDIDDocument.getIdentifier());
        this.remoteEnclaveClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDID);
    }
    catch (err) {
        console.log("Error at initialising remote client", err);
    }
}

async initWallet() {
    //this.initSidebar();
    if (rawDossier) {
        await $$.promisify(rawDossier.writeFile, rawDossier)("/environment.json", JSON.stringify({
            "vaultDomain": "vault",
            "didDomain": "vault",
            "enclaveType": "MemoryEnclave"
        }));
    }
    const sc = openDSU.loadAPI("sc").getSecurityContext();
    if (sc.isInitialised()) {
        await this.initEnclaveClient();
    }
    else {
        sc.on("initialised", this.initEnclaveClient.bind(this));
    }
    console.log("AppManager init");
    this.registerListeners();

    let url = window.location.hash;
    window.appManager.navigateToPage(url);
}

init();
initEnclaveClient();

window.appManager.setDomElementForPages(document.querySelector("#page-content"));
