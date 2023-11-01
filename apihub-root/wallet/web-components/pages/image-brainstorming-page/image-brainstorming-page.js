import {
    extractFormInformation,
    reverseQuerySelector, showModal
} from "../../../imports.js";
export class imageBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {

    }

    afterRender() {

    }
    async showAddImageModal() {
        await showModal(document.querySelector("body"), "add-image-modal", { presenter: "add-personality-modal"});
    }

}