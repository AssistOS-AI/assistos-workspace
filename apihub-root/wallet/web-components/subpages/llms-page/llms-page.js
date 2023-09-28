import { showModal, showActionBox, Space, getClosestParentElement } from "../../../imports.js";

export class llmsPage {
    constructor(element) {
        this.key = "Key";
        this.name = "Name";
        this.url = "Url";
        this.modal = "showAddLLMModal";
        this.button = "Add LLM";
        this.tableRows = "No data loaded";
        this.element = element;
        this._llmConfigs = webSkel.space.getLLMs();
        if(webSkel.space.settings.llms) {
            this._llmConfigs = webSkel.space.settings.llms;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._llmConfigs = webSkel.space.settings.llms;
            this.invalidate();
        }
    }

    beforeRender() {
        this.tableRows = "";
        if (this._llmConfigs && this._llmConfigs.length > 0) {
            this._llmConfigs.forEach((item) => {
                this.tableRows += `<llm-unit data-name="${item.name}" data-key="${item.key}" data-url="${item.url}" data-primary-key="${item.id}"></llm-unit>`;
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

    async editAction(_target) {
        let id = getClosestParentElement(_target, "action-box").getAttribute("id");
        await showModal(document.querySelector("body"), "edit-llm-key-modal", { presenter: "edit-llm-key-modal", id: id});
    }
}