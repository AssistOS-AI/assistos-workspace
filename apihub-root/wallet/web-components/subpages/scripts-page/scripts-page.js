import {
    showModal,
    showActionBox,
    reverseQuerySelector
} from "../../../imports.js";

export class scriptsPage {
    constructor(element, invalidate) {
        this.notificationId = "space:space-page:scripts";
        webSkel.currentUser.space.observeChange(this.notificationId,invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if (webSkel.currentUser.space.scripts.length > 0) {
            webSkel.currentUser.space.scripts.forEach((item) => {
                this.tableRows += `<script-unit data-id="${item.id}" 
                data-name="${item.name}" data-content="${item.content}" 
                data-description="${item.description}" data-local-action="editAction"></script-unit>`;
            });
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getScriptId(_target){
        return reverseQuerySelector(_target, "script-unit").getAttribute("data-id");
    }
    async showAddScriptModal() {
        await showModal(document.querySelector("body"), "add-script-modal", { presenter: "add-script-modal"});
    }
    async editAction(_target){
        await showModal(document.querySelector("body"), "edit-script-modal", { presenter: "edit-script-modal", id: this.getScriptId(_target)});
    }
    async deleteAction(_target){
        await webSkel.currentUser.space.deleteScript(this.getScriptId(_target));
        this.invalidate();
    }

}