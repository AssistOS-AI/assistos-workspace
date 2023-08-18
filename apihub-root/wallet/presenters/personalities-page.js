import { Company } from "../core/company.js";

export class personalitiesPage {
    constructor() {
        this.title = "Personalities";
        this.shortname = "Shortname";
        this.aiPrompt = "AIPrompt";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Personality";
        this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(()=>{
                this._personalityConfigs = currentCompany.companyState.personalities;
                this.invalidate();},
            0);
        currentCompany.onChange((companyState) => {
            this._personalityConfigs = companyState.personalities;
            this.invalidate();
        });
        document.addEventListener("click", (event) => {
            let showBox = document.querySelectorAll("div.action-box");
            showBox.forEach((actionWindow) => {
                if(actionWindow.style.display === "block")
                    actionWindow.style.display = "none";
            });
        }, true);
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

const onClickOutside = (e) => {
    if (!e.target.className.includes("action-box")) {
        e.target.style.display = "none";
    }
};

export function showActionBox(primaryKey) {
    let showBox= document.getElementById(primaryKey);
    if(showBox.style.display==="none" || showBox.style.display==="") {
        showBox.style.display = "block";
    }
}