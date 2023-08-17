import { Company } from "../core/company.js";

export class llmsPage {

    constructor() {
        this.title = "LLMS management";
        this.key = "KEY";
        this.name = "NAME";
        this.url = "URL";
        this.button = "Add LLM";
        this.tableRows = "No data loaded";

        Company.getInstance().onChange((companyState) => {
            this._llmConfigs = companyState.llms;
            this.invalidate();
        });
    }

    beforeRender() {
        this.tableRows="";
        this._llmConfigs.forEach((item) => {
            this.tableRows += `<llm-item-renderer data-name=${item.name} data-key=${item.key} data-url=${item.url} data-primary-key=${item.primaryKey}"></llm-item-renderer>`;
        });
    }

    showAddLLMModal() {

    }

    // WebSkel.register
}

const onClickOutside = (e) => {
    if (!e.target.className.includes("action-box")) {
        e.target.style.display = "none";
    }
};

window.clickListenerDefinedForDocument = false;

export function showActionBox(primaryKey) {
    let showBox= document.getElementById(primaryKey);
    showBox.style.display = "block";
    if(!window.clickListenerDefinedForDocument) {
        window.clickListenerDefinedForDocument = true;
        document.addEventListener("click", (event) => {
            let showBox = document.querySelectorAll("div.action-box");
            showBox.forEach((actionWindow) => {
                actionWindow.style.display = "none";
            });
        });
        // document.removeEventListener("click", );
    }
}