import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class myOrganisationPage {
    constructor() {
        this.modal = "showAddAnnounceModal";
        this.button = "Add announce";
        // this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(async ()=> {
            this._announceConfigs = await currentCompany.companyState.announces;
            this.invalidate();
        },0);
        currentCompany.onChange((companyState) => {
            this._announceConfigs = companyState.announces;
            this.invalidate();
        });
    }

    beforeRender() {
        // this.tableRows="";
        // if(this._documentConfigs) {
        //     this._documentConfigs.forEach((item) => {
        //         this.tableRows += `<document-item-renderer data-name='${item.name}' data-status="${item.status}" data-primary-key=${item.primaryKey}"></document-item-renderer>`;
        //     });
        // } else {
        //     this.tableRows=`<div> No Data Currently </div>`;
        // }
    }
    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "add-announce-modal", {});
        });
    }
}