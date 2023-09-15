import { showModal, showActionBox } from "../../../imports.js";

export class personalitiesPage {
    constructor(element) {
        this.name = "name";
        this.description = "Description";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Personality";
        this.tableRows = "No data loaded";
        this.element = element;
        if (webSkel.company.settings.personalities) {
            this._personalityConfigs = webSkel.company.settings.personalities;
            setTimeout(() => {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.company.settings.personalities;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._personalityConfigs && this._personalityConfigs.length > 0) {
            this._personalityConfigs.forEach((item) => {
                console.log(item);
                this.tableRows += `<personality-item-renderer data-name="${item.name}" data-description="${item.description}"></personality-item-renderer>`;
            });
        } else {
            this.tableRows = `<personality-item-renderer data-name="No data loaded"></personality-item-renderer>`;
        }
    }

    async showAddPersonalityModal(_target) {
        await showModal(document.querySelector("body"), "add-personality-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}