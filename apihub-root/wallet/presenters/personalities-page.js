import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class personalitiesPage {
    constructor() {
        this.title = "Personalities";
        this.shortname = "Shortname";
        this.aiPrompt = "AIPrompt";
        this.modal = "showAddPersonalityModal";
        this.button = "Add Personality";
        this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(async ()=>{
                this._personalityConfigs = await currentCompany.companyState.personalities;
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
        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "add-personality-modal", {});
        });
    }
}