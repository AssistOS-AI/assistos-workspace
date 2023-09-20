import { showModal, showActionBox } from "../../../imports.js";

export class personalitiesPage {
    constructor(element) {
        this.name = "name";
        this.description = "Description";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Personality";
        this.tableRows = "No data loaded";
        this.element = element;
        if (webSkel.space.settings.personalities) {
            this._personalityConfigs = webSkel.space.settings.personalities;
            setTimeout(() => {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.space.settings.personalities;
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._personalityConfigs && this._personalityConfigs.length > 0) {
            this._personalityConfigs.forEach((item) => {
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