import { Company } from "../core/company.js";
import { showModal } from "../../WebSkel/utils/modal-utils.js";
import {getClosestParentElement} from "../../WebSkel/utils/dom-utils.js";

export class documentsPage {
    constructor() {
        this.name = "Name";
        this.modal = "showAddNewDocumentModal";
        this.button = "Add document";
        this.tableRows = "No data loaded";

        let currentCompany = Company.getInstance();

        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }
   async showAddNewDocumentModal() {
        await showModal(document.querySelector("body"), "add-new-document-modal", {});
    }
    async editAction(){
        let editButton = document.querySelector("[data-local-action='editAction']");
        let rowElement=getClosestParentElement(editButton,['document-item-renderer']);
        await webSkel.changeToStaticPage(`documents/${rowElement.getAttribute('data-id')}`);
    }
    async deleteAction(){
        let deleteButton = document.querySelector("[data-local-action='deleteAction']");
        if (deleteButton) {
                const rowElement = getClosestParentElement(deleteButton, "document-item-renderer");
                let documentIdToRemove = parseInt(rowElement.getAttribute('data-id'));

                await webSkel.liteUserDB.deleteRecord("documents", documentIdToRemove);
                let currentCompany = Company.getInstance();
                let length = currentCompany.companyState.documents.length;
                for (let documentIndex = 0; documentIndex < length; documentIndex++) {
                    if (currentCompany.companyState.documents[documentIndex].id === documentIdToRemove) {
                        currentCompany.companyState.documents.splice(documentIndex, 1);
                        break;
                    }
                }
                currentCompany.notifyObservers();
            }
        }
    beforeRender() {
        this.tableRows="";
        if(this._documentConfigs) {
            this._documentConfigs.forEach((item) => {
                this.tableRows += `<document-item-renderer data-name="${item.name}" data-id="${item.id}"></document-item-renderer>`;
            });
        } else {
            this.tableRows=`<div> No Data Currently </div>`;
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {}
}