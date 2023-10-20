import { showModal, showActionBox, reverseQuerySelector } from "../../../imports.js";

export class personalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.notificationId = webSkel.space.getNotificationId() +":space-page:personalities-page";
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

    async openEditPersonalityPage(_target){
        let personalityId = reverseQuerySelector(_target, "personality-unit").getAttribute("data-id");
        await webSkel.changeToDynamicPage("edit-personality-page", `space-pace/edit-personality-page/${personalityId}`);
    }
}