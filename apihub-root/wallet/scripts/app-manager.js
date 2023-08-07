import FrontEndController from "./front-end-controller.js";
import { isInternalUrl } from "./utils/url-utils.js";

const DOMAIN = "default";
const openDSU = require("opendsu");

class AppManager {
    constructor() {
        this.element = document.querySelector(".app-container");
        this.frontEndController = new FrontEndController();
        this.appContent = document.querySelector("#page-content");
        this.sidebar = document.querySelector('#tools-sidebar');//#brands-sidebar
        this.appContent.addEventListener("click", this.interceptAppContentLinks.bind(this));
        this.actionRegistry = {};
        console.log("creating new app manager instance");
    }

    set currentPost(currentPost) {
        //console.trace(`changing current post from ${this._currentPost} to ${currentPost}`)
        this._currentPost=currentPost; return true;}
    get currentPost() { return this._currentPost; }
    async init() {
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

    async initSidebar(){
        const content = await this.frontEndController.getToolsPage(DOMAIN);
        this.sidebar.innerHTML = content;
    }

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

    async showLoading() {

        const loading = document.createElement("dialog");
        loading.classList.add("spinner");
        // loading.duration = 2000;

        document.body.appendChild(loading);
        await loading.showModal();
        return loading;
    }

    async navigateToToolPage() {
        const id = this.currentToolId;
        console.log(id);
        await this.changePage(() => this.frontEndController.getToolPage(DOMAIN, id));
    }

    showActionBox(primaryKey) {
        var showBox= document.getElementById(primaryKey);
        console.log(showBox);
        showBox.style.display = "block";
        document.addEventListener("click", (event) => {
            var showBox = document.querySelectorAll("div.action-box");
            showBox.forEach((actionWindow) => {
                actionWindow.style.display = "none";
            });
        });
    }

    async navigateToToolsPage() {
        await this.changePage(() => this.frontEndController.getToolsPage(DOMAIN));
    }

    async navigateToPage(url){
        await this.changePage(() => this.frontEndController.getPage(url));
    }

    async changePage(getPageContentAsync) {
        const loading = await this.showLoading();
        try {
            const pageContent = await getPageContentAsync();
             this.updateAppContent(pageContent);
        } catch (error) {
            console.log("Failed to change page", error);
        } finally {
            loading.close();
            loading.remove();
        }
    }

    async interceptAppContentLinks(e) {
        let target = e.target || e.srcElement;
        let url;
        if (target.tagName === "A") {
            url = target.getAttribute("href");
        } else if (target.hasAttribute("data-url")) {
            url = target.getAttribute("data-url");
        }

        if (url && isInternalUrl(url)) {
            console.log(`Intercept link ${url}`);
            e.preventDefault();

            await this.changePage(() => this.frontEndController.getPage(url));
            return false;
        }
    }

    updateAppContent(content) {
        this.appContent.innerHTML = content;
    }

    registerListeners() {
        window.onpopstate = (e) => {
            if (e.state && e.state.relativeUrlContent) {
                this.updateAppContent(e.state.relativeUrlContent);
            }
        };

        // register listener for data-action attribute
        this.element.addEventListener("click", (event) => {
            let target= event.target;

            while (target && target !== this.element) {
                if (target.hasAttribute("data-action")) {
                    event.preventDefault(); // Cancel the native event
                    event.stopPropagation(); // Don't bubble/capture the event any further

                    const action = target.getAttribute("data-action");
                    const [actionName, ...actionParams] = action.split(" ");

                    if (actionName) {
                        this.callAction(actionName,target,...actionParams);
                    }
                    else {
                        console.error(`${target} : data action attribute value should not be empty!`);
                    }
                    break;
                }
                target = target.parentElement;
            }
        });
    }

    registerAction(actionName, actionHandler) {
        this.actionRegistry[actionName] = actionHandler;
    }

    callAction(actionName, ...params) {
        const actionHandler = this.actionRegistry[actionName];
        if (!actionHandler) {
            throw new Error(`No action handler registered for "${actionName}"`);
        }

        let thisCall = params && params[0] instanceof HTMLElement ? params[0] : null;

        actionHandler.call(thisCall, ...params);
    }
}

export default AppManager;
