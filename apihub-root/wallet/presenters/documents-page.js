import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";
import { setSelectedDocument } from "../main.js";

export class documentsPage {
    constructor() {
        // this.title = "Documents";
        this.name = "Name";
        this.modal = "showAddNewDocumentModal";
        this.button = "Add new document";
        this.tableRows = "No data loaded";
        let currentCompany= Company.getInstance();
        setTimeout(async ()=> {
                this._documentConfigs = currentCompany.companyState.documents;
                this.invalidate();
        },0);
        currentCompany.onChange((companyState) => {
            this._documentConfigs = companyState.documents;
            this.invalidate();
        });
    }

    beforeRender() {
        this.tableRows="";
        if(this._documentConfigs) {
            this._documentConfigs.forEach((item) => {
                this.tableRows += `<document-item-renderer data-name="${item.name}" data-primary-key="${item.primaryKey}"></document-item-renderer>`;
            });
        } else {
            this.tableRows=`<div> No Data Currently </div>`;
        }
    }
    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {
        /*let modalSection = document.querySelector("[data-local-action='showAddNewDocumentModal']");
        modalSection.addEventListener("click", async (event) => {
            await showModal(document.querySelector("body"), "add-new-document-modal", {});
        });
        let editButton = document.querySelector("[data-local-action='editAction']");
        editButton.addEventListener("click", async (event) => {
            setSelectedDocument(editButton.parentNode.id);
            webSkel.changeToDynamicPage("doc-page-by-title");
        });*/
    }
}