import { Company } from "../../core/company.js";

export class proofReaderPage {
    constructor() {
        // this.title = "Personalities";
        // this.shortname = "Shortname";
        // this.aiPrompt = "AIPrompt";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Personality";
        // this.tableRows = "No data loaded";
        let currentCompany = Company.getInstance();

        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            console.log(this._documentConfigs.length);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
        // document.addEventListener("click", (event) => {
        //     let showBox = document.querySelectorAll("div.action-box");
        //     showBox.forEach((actionWindow) => {
        //         if(actionWindow.style.display === "block")
        //             actionWindow.style.display = "none";
        //     });
        // }, true);
    }

    beforeRender() {
        this.tableRows="";
        if(this._personalityConfigs) {
            this._personalityConfigs.forEach((item) => {
                this.tableRows += `<personality-item-renderer data-shortname=${item.shortname} data-ai-prompt="${item.aiPrompt}" data-primary-key=${item.primaryKey}"></personality-item-renderer>`;
            });
        } else {
            this.tableRows=`<div> No Data Currently </div>`;
        }
    }
    /* adding event Listeners after the web component has loaded, etc */
    afterRender(){

    }
}