import { showModal, showActionBox } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class scriptsPage {
    constructor(element) {
        this.name = "name";
        this.preview = "Preview";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Script";
        this.tableRows = "No data loaded";
        this.element = element;
        if (webSkel.space.settings.scripts) {
            this._scriptsConfigs = webSkel.space.settings.scripts;
            setTimeout(() => {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._scriptsConfigs = webSkel.space.settings.scripts;
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._scriptsConfigs && this._scriptsConfigs.length > 0) {
            this._scriptsConfigs.forEach((item) => {
                this.tableRows += `<script-unit data-name="${item.name}" data-content="${item.content}" data-id="${item.id}"></script-unit>`;
            });
        } else {
            this.tableRows = `<script-unit data-name="No data loaded"></script-unit>`;
        }
    }

    async showAddScriptModal() {
        await showModal(document.querySelector("body"), "add-script-modal", { presenter: "add-script-modal"});
    }

    async editAction(_target){
        let script = reverseQuerySelector(_target, "script-unit");
        await showModal(document.querySelector("body"), "edit-script-modal", { presenter: "edit-script-modal", id: script.getAttribute("data-id")});
    }
    async deleteAction(_target){
        let script = reverseQuerySelector(_target, "script-unit");
        let scriptId = script.getAttribute("data-id");
        let response = await fetch(`/space/${window.currentCompanyId}/myspace/scripts/delete/${scriptId}`, {method: "DELETE"});
        console.log(response);
        webSkel.company.notifyObservers();

    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}