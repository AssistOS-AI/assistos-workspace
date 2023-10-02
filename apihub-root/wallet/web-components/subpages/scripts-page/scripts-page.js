import { showModal, showActionBox } from "../../../imports.js";
import { reverseQuerySelector } from "../../../../WebSkel/utils/dom-utils.js";

export class scriptsPage {
    constructor(element, invalidate) {
        this.modal = "showAddScriptModal";
        this.notificationId = "space:space-page:scripts";
        webSkel.space.observeChange(this.notificationId,invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if (webSkel.space.scripts.length > 0) {
            webSkel.space.scripts.forEach((item) => {
                this.tableRows += `<script-unit data-id="${item.id}" data-name="${item.name}" data-content="${item.content}"></script-unit>`;
            });
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }
    async showAddScriptModal() {
        await showModal(document.querySelector("body"), "add-script-modal", { presenter: "add-script-modal"});
    }

    async editAction(_target){
        let script = reverseQuerySelector(_target, "script-unit");
        await showModal(document.querySelector("body"), "edit-script-modal", { presenter: "edit-script-modal", id: script.getAttribute("data-id")});
    }
    getScriptId(_target){
        return reverseQuerySelector(_target, "script-unit").getAttribute("data-id");
    }
    async deleteAction(_target){
        await webSkel.space.deleteScript(this.getScriptId(_target));
        this.invalidate();
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}