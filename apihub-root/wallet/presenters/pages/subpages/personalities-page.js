import { showActionBox } from "../../../../WebSkel/utils/modal-utils.js";
import { showModal } from "../../../utils/modal-utils.js";

export class personalitiesPage {
    constructor(element) {
        this.shortname = "Shortname";
        this.description = "Description";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Personality";
        this.tableRows = "No data loaded";
        this.element = element;
        if (webSkel.company.personalities) {
            this._personalityConfigs = webSkel.company.personalities;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.company.personalities;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._personalityConfigs && this._personalityConfigs.length > 0) {
            this._personalityConfigs.forEach((item) => {
                this.tableRows += `<personality-item-renderer data-shortname="${item.shortname}" data-description="${item.description}"></personality-item-renderer>`;
            });
        } else {
            this.tableRows = `<personality-item-renderer data-shortname="No data loaded"></personality-item-renderer>`;
        }
    }

    async showAddPersonalityModal(_target) {
        await showModal(document.querySelector("body"), "add-personality-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}