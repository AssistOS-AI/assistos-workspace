import { showModal, showActionBox } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class personalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if (webSkel.space.settings.personalities.length > 0) {
            webSkel.space.settings.personalities.forEach((item) => {
                this.tableRows += `<personality-unit data-name="${item.name}" data-description="${item.description}" data-id="${item.id}"></personality-unit>`;
            });
        } else {
            this.tableRows = `<div class="no-data-loaded">No data loaded</div>`;
        }
    }
    async showAddPersonalityModal() {
        await showModal(document.querySelector("body"), "add-personality-modal", { presenter: "add-personality-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getPersonalityId(_target){
        return reverseQuerySelector(_target, "personality-unit").getAttribute("data-id");
    }
    async editAction(_target) {
        await showModal(document.querySelector("body"), "edit-llm-key-modal", {presenter: "edit-llm-key-modal", id: this.getLLMId(_target)});
    }
    async deleteAction(_target){
        await webSkel.space.deletePersonality(this.getPersonalityId(_target));
        this.invalidate();
    }
}