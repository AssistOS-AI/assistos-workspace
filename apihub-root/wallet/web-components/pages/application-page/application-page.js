import {showModal, reverseQuerySelector, showActionBox} from "../../../imports.js";

export class ApplicationPage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate = invalidate;
        this.invalidate();
        let name = window.location.hash.split("/")[3];
        this._app = webSkel.currentUser.space.getApplicationByName(name);
    }

    beforeRender() {
        this.appName = this._app.name;
        this.appFlows = "";
        if (this._app.flows.length > 0) {
            this._app.flows.sort(function(a, b) {
                return a.class.name.toLowerCase().localeCompare(b.class.name.toLowerCase());
            });
            this._app.flows.forEach((item) => {
                this.appFlows += `<flow-unit data-id="${item.class.id}" data-name="${item.class.name}" data-description="${item.class.description}" data-local-action="editAction"></flow-unit>`;
            });
        } else {
            this.appFlows = `<div class="no-data-loaded">No data loaded</div>`;
        }
        this.description = this._app.description;
        this.installed = false;
        for (let installedApplication of webSkel.currentUser.space.installedApplications) {
            if (installedApplication.id === this._app.id) {
                this.installed = true;
            }
        }
        this.applicationButtons = "";
        if (this.installed) {
            this.applicationButtons += `<button class="btn btn-primary general-button" data-local-action="uninstallApplication">Uninstall</button>`;
        }else{
            this.applicationButtons += `<button class="btn btn-primary general-button" data-local-action="installApplication">Install</button>`;
        }
        this.orgName = "Axiologic";
        let tags = ["Tools", "Ai"];
        let string = "";
        for(let tag of tags){
            string+=`<div class="tag">${tag}</div>`
        }
        this.tags = string;
    }
    async installApplication() {
        const loadingId = await webSkel.showLoading();
        await webSkel.appServices.installApplication(this.appName);
        webSkel.hideLoading(loadingId);
        location.reload();
    }
    async uninstallApplication() {
        const loadingId = await webSkel.showLoading();
        await webSkel.appServices.uninstallApplication(this.appName);
        webSkel.hideLoading(loadingId);
        location.reload();
    }

    async openApplicationsMarketplacePage(){
        await webSkel.changeToDynamicPage("applications-marketplace-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/applications-marketplace-page`);
    }
    getFlowId(_target){
        return reverseQuerySelector(_target, "flow-unit").getAttribute("data-id");
    }
    async editAction(_target){
        await showModal( "edit-flow-modal", { presenter: "edit-flow-modal", id: this.getFlowId(_target), appId: this._app.id});
    }
    async deleteAction(_target){
        this._app.flows = this._app.flows.filter(flow => flow.id !== this.getFlowId(_target));
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteFlow");
        await webSkel.appServices.callFlow(flowId, this.getFlowId(_target), this._app.id);
        this.invalidate();
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}