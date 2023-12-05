import {
    showModal,
    reverseQuerySelector
} from "../../../imports.js";

export class personalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.notificationId = webSkel.currentUser.space.getNotificationId() +":space-page:personalities-page";
        webSkel.currentUser.space.observeChange(this.notificationId,invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.personalityBlocks = "";
        if (webSkel.currentUser.space.personalities.length > 0) {
            webSkel.currentUser.space.personalities.forEach((item) => {
                this.personalityBlocks += `<personality-unit data-name="${item.name}" data-description="${item.description}" data-id="${item.id}" data-image="${item.image}"></personality-unit>`;
            });
        }
    }
    async showAddPersonalityModal() {
        await showModal(document.querySelector("body"), "add-personality-modal", { presenter: "add-personality-modal"});
    }

    async selectPersonality(_target){
        let personalityId = reverseQuerySelector(_target, "personality-unit").getAttribute("data-id");
        window.location.hash = `#space-page/edit-personality-page/${personalityId}`;
        await webSkel.changeToDynamicPage("edit-personality-page", `space-page/edit-personality-page/${personalityId}`);
    }
}