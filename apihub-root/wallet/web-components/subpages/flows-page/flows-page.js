import {
    showModal,
    showActionBox,
    reverseQuerySelector
} from "../../../imports.js";

export class flowsPage {
    constructor(element, invalidate) {
        this.notificationId = "space:space-page:flows";
        webSkel.currentUser.space.observeChange(this.notificationId,invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.element = element;
    }
    beforeRender() {
        this.tableRows = "";
        if (webSkel.currentUser.space.flows.length > 0) {
            webSkel.currentUser.space.flows.sort(function(a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            webSkel.currentUser.space.flows.forEach((item) => {
                this.tableRows += `<flow-unit data-id="${item.id}" 
                data-name="${item.name}" data-content="${item.content}" 
                data-description="${item.description}" data-local-action="editAction"></flow-unit>`;
            });
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }

    afterRender(){
        this.filters = this.element.querySelector(".filters");
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getFlowId(_target){
        return reverseQuerySelector(_target, "flow-unit").getAttribute("data-id");
    }
    async showAddFlowModal() {
        await showModal(document.querySelector("body"), "add-flow-modal", { presenter: "add-flow-modal"});
    }
    async editAction(_target){
        await showModal(document.querySelector("body"), "edit-flow-modal", { presenter: "edit-flow-modal", id: this.getFlowId(_target)});
    }
    async deleteAction(_target){
        await webSkel.currentUser.space.deleteFlow(this.getFlowId(_target));
        this.invalidate();
    }

    importFlows(){
        alert("To be implemented.");
    }
    exportFlows(){
        alert("To be implemented.");
    }

    openFilter(){
      this.filters.style.display = "flex"
    }

}