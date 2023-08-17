import { Company } from "../core/company.js";

export class llmsPage {

    constructor() {
        this.title = "LLMS management";
        this.key = "KEY";
        this.name = "NAME";
        this.url = "URL";
        this.button = "Add LLM";
        this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(()=>{
                this._llmConfigs = currentCompany.companyState.llms;
                this.invalidate();},
            0);
        currentCompany.onChange((companyState) => {
            this._llmConfigs = companyState.llms;
            this.invalidate();
        });

    }

    beforeRender() {
        this.tableRows="";
        if(this._llmConfigs) {
            this._llmConfigs.forEach((item) => {
                this.tableRows += `<llm-item-renderer data-name=${item.name} data-key=${item.key} data-url=${item.url} data-primary-key=${item.primaryKey}"></llm-item-renderer>`;
            });
        }else{
            this.tableRows=`<div> No Data Currently </div>`;
        }
    }

    showAddLLMModal() {

    }
}

const onClickOutside = (e) => {
    if (!e.target.className.includes("action-box")) {
        e.target.style.display = "none";
    }
};

//window.clickListenerDefinedForDocument = false;

export function showActionBox(primaryKey) {
    let showBox= document.getElementById(primaryKey);
    if(showBox.style.display==="none") {
        showBox.style.display = "block";
    }
    // if(!window.clickListenerDefinedForDocument) {
    //     window.clickListenerDefinedForDocument = true;

        // document.removeEventListener("click", );
}