import {showModal, reverseQuerySelector} from "../../../imports.js";

export class applicationPage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate = invalidate;
        this.invalidate();
        let id = webSkel.getService("UtilsService").parseURL();
        this._app = webSkel.currentUser.space.getApplication(id);
    }

    beforeRender() {
        this.appName = this._app.id;
        this.appFlows = "";
        if (this._app.flows.length > 0) {
            this._app.flows.sort(function(a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            this._app.flows.forEach((item) => {
                this.appFlows += `<flow-unit data-id="${item.id}" data-name="${item.name}" data-description="${item.description}" data-local-action="editAction"></flow-unit>`;
            });
        } else {
            this.appFlows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }

    async openApplicationsMarketplacePage(){
        await webSkel.changeToDynamicPage("applications-marketplace-page", "space/applications-marketplace-page");
    }
    getFlowId(_target){
        return reverseQuerySelector(_target, "flow-unit").getAttribute("data-id");
    }
    async editAction(_target){
        await showModal(document.querySelector("body"), "edit-flow-modal", { presenter: "edit-flow-modal", id: this.getFlowId(_target)});
    }
    async deleteAction(_target){
        this._app.flows = this._app.flows.filter(flow => flow.id !== this.getFlowId(_target));
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteFlow");
        await webSkel.getService("LlmsService").callFlow(flowId, this.getFlowId(_target));
        this.invalidate();
    }
}