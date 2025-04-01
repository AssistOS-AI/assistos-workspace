const utilModule = require("assistos").loadModule("util", {});

export class FlowsPage {
    constructor(element, invalidate) {
        this.refreshFlows = async () =>{
            this.flows = [];
        }
        this.id = "flows";
        this.element = element;
        this.invalidate = invalidate;
        this.spaceChecked = "checked";
        this.invalidate(async()=>{
            this.flows = await assistOS.space.flows;
            this.boundsOnListUpdate = this.onListUpdate.bind(this);
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, this.id, this.boundsOnListUpdate);
        });
    }
    onListUpdate(){
        this.invalidate(this.refreshFlows);
    }
    beforeRender() {
        const generateTableRow = (item) => `
        <flow-item data-name="${item.constructor.name}"  data-action="${item.constructor.flowMetadata.action}" data-local-action="editAction"></flow-item>`;

        const sortFlows = (flows) => flows.sort((a, b) => a.constructor.name.toLowerCase().localeCompare(b.constructor.name.toLowerCase()));


        if (this.flows.length > 0) {
            this.flows = sortFlows(this.flows);
            this.tableRows = this.flows.map(generateTableRow).join("");
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getFlowName(_target) {
        return assistOS.UI.reverseQuerySelector(_target, "flow-item").getAttribute("data-name");
    }

    async showAddFlowModal() {
        await assistOS.UI.showModal("add-flow-modal", {presenter: "add-flow-modal"});
    }

    async editAction(_target) {
        await assistOS.UI.showModal("edit-flow-modal", {presenter: "edit-flow-modal", name: this.getFlowName(_target)});
    }

    async deleteAction(_target) {
        alert("to be done")
    }

    importFlows() {
        alert("To be implemented.");
    }

    exportFlows() {
        alert("To be implemented.");
    }

}