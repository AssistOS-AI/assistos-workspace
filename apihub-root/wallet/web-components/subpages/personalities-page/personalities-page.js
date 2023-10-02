import { showModal, showActionBox } from "../../../imports.js";

export class personalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if (webSkel.space.settings.personalities > 0) {
            webSkel.space.settings.personalities.forEach((item) => {
                this.tableRows += `<personality-unit data-name="${item.name}" data-description="${item.description}"></personality-unit>`;
            });
        } else {
            this.tableRows = `<personality-unit data-name="No data loaded"></personality-unit>`;
        }
    }
    async showAddPersonalityModal() {
        await showModal(document.querySelector("body"), "add-personality-modal", { presenter: "add-personality-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}