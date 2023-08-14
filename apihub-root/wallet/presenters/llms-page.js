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
            this.tableRows += `<llm-item-renderer  ></llm-item-renderer>`;
        });
    }

    showAddLLMModal() {

    }
}

// export default llmsPage;
