import {showModal, reverseQuerySelector, showActionBox} from "../../../imports.js";

export class applicationPage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate = invalidate;
        this.invalidate();
        let name = webSkel.appServices.parseURL();
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
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.appServices.installApplication(this.appName);
        loading.close();
        loading.remove();
        location.reload();
    }
    async uninstallApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.appServices.uninstallApplication(this.appName);
        loading.close();
        loading.remove();
        location.reload();
    }

    async openApplicationsMarketplacePage(){
        await webSkel.changeToDynamicPage("applications-marketplace-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/applications-marketplace-page`);
    }
    getFlowId(_target){
        return reverseQuerySelector(_target, "flow-unit").getAttribute("data-id");
    }
    async editAction(_target){
        await showModal(document.querySelector("body"), "edit-flow-modal", { presenter: "edit-flow-modal", id: this.getFlowId(_target), appId: this._app.id});
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