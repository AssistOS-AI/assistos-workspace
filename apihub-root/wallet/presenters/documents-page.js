import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";

export class documentsPage {
    constructor() {
        this.name = "Name";
        this.modal = "showAddNewDocumentModal";
        this.button = "Add document";
        this.tableRows = "No data loaded";
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
    }

    beforeRender() {
        this.tableRows="";
        if(this._documentConfigs) {
            this._documentConfigs.forEach((item) => {
                this.tableRows += `<document-item-renderer data-name="${item.name}" data-primary-key="${item.id}"></document-item-renderer>`;
            });
        } else {
            this.tableRows=`<div> No Data Currently </div>`;
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        let modalSection = document.querySelector("[data-local-action]");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "add-new-document-modal", {});
        });
    }
}