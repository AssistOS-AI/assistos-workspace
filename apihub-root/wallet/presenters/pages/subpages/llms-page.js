import { showActionBox } from "../../../../WebSkel/utils/modal-utils.js";
import { showModal } from "../../../utils/modal-utils.js";
import { llmsService } from "../../../core/services/llmsService.js";

export class llmsPage {
    constructor(element) {
        this.key = "Key";
        this.name = "Name";
        this.url = "Url";
        this.modal = "showAddLLMModal";
        this.button = "Add LLM";
        this.tableRows = "No data loaded";
        this.element = element;
        const llmService = new llmsService();
        this._llmConfigs = llmService.getLLMs();
        if(webSkel.company.llms) {
            this._llmConfigs = webSkel.company.llms;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._llmConfigs = webSkel.company.llms;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._llmConfigs && this._llmConfigs.length > 0) {
            this._llmConfigs.forEach((item) => {
                this.tableRows += `<llm-item-renderer data-name="${item.name}" data-key="${item.key}" data-url="${item.url}" data-primary-key="${item.primaryKey}"></llm-item-renderer>`;
            });
        } else {
            this.tableRows = `<llm-item-renderer data-name="No data loaded"></llm-item-renderer>`;
        }
    }

    async showAddLLMModal(_target) {
        await showModal(document.querySelector("body"), "add-llm-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}