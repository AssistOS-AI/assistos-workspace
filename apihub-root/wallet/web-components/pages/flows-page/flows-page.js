import {
    showModal, showActionBox, reverseQuerySelector
} from "../../../imports.js";

export class FlowsPage {
    constructor(element, invalidate) {
        system.space.observeChange(system.space.getNotificationId(), invalidate);
        this.element = element;
        this.selectedTypes = [];
        this.invalidate = invalidate;
        this.spaceChecked="checked";
        this.invalidate();
    }


    beforeRender() {
        const generateTableRow = (item) => `
        <flow-unit data-id="${item.class.id}" data-name="${item.class.name}" data-description="${item.class.description}" data-local-action="editAction"></flow-unit>`;

        const sortFlows = (flows) => flows.sort((a, b) => a.class.name.toLowerCase().localeCompare(b.class.name.toLowerCase()));

        this.flows = system.space.flows;
        if (this.flows.length > 0) {
            this.flows = sortFlows(this.flows);
            this.tableRows = this.flows.map(generateTableRow).join("");
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }

    afterRender() {
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getFlowId(_target) {
        return reverseQuerySelector(_target, "flow-unit").getAttribute("data-id");
    }

    async showAddFlowModal() {
        await showModal("add-flow-modal", {presenter: "add-flow-modal"});
    }

    async editAction(_target) {
        await showModal("edit-flow-modal", {presenter: "edit-flow-modal", id: this.getFlowId(_target)});
    }

    async deleteAction(_target) {
        this.filteredFlows = this.filteredFlows.filter(flow => flow.id !== this.getFlowId(_target));
        let flowId = system.space.getFlowIdByName("DeleteFlow");
        let context = {
            flowId: this.getFlowId(_target)
        }
        await system.services.callFlow(flowId, context);
        this.invalidate();
    }

    importFlows() {
        alert("To be implemented.");
    }

    exportFlows() {
        alert("To be implemented.");
    }

}