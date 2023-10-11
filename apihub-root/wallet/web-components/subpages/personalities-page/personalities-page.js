import { showModal, showActionBox } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class personalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.notificationId = "space:space-page:personalities-page";
        webSkel.space.observeChange(this.notificationId,invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.personalityBlocks = "";
        if (webSkel.space.settings.personalities.length > 0) {
            webSkel.space.settings.personalities.forEach((item) => {
                this.personalityBlocks += `<personality-unit data-name="${item.name}" data-description="${item.description}" data-id="${item.id}" data-image="${item.image}"></personality-unit>`;
            });
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
    async deleteAction(_target){
        await webSkel.space.deletePersonality(this.getPersonalityId(_target));
        this.invalidate();
    }
}