import { showModal, showActionBox, Space, getClosestParentElement } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

export class llmsPage {
    constructor(element,invalidate) {
        this.modal = "showAddLLMModal";
        this.notificationId="space:space-page:llms";
        webSkel.space.observeChange(this.notificationId,invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if (webSkel.space.settings.llms.length > 0) {
            webSkel.space.settings.llms.forEach((item) => {
                this.tableRows += `<llm-unit data-name="${item.name}" data-key="${item.key}" data-url="${item.url}" data-id="${item.id}"></llm-unit>`;
            });
        } else {
            this.tableRows = `<llm-unit data-name="No data loaded"></llm-unit>`;
        }
    }

    async showAddLLMModal(_target) {
        await showModal(document.querySelector("body"), "add-llm-modal", { presenter: "add-llm-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getComponentAttributeValue(_target,compName,attribute){
        return reverseQuerySelector(_target, `${compName}`).getAttribute(`${attribute}`);
    }
    getLLMId(_target){
       return reverseQuerySelector(_target, "llm-unit").getAttribute("data-id");
    }
    async editAction(_target) {
        await showModal(document.querySelector("body"), "edit-llm-key-modal", {presenter: "edit-llm-key-modal", id: this.getLLMId(_target)});
    }
    async deleteAction(_target){
        await webSkel.space.deleteLLM(this.getLLMId(_target));
        this.invalidate();
    }
}