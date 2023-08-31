import { Company } from "../../core/company.js";
import { closeModal, showModal } from "../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";
import { Document } from "../../core/models/document.js";

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

    async editAction(_target){
        console.log(_target);
        let rowElement = getClosestParentElement(_target,['document-item-renderer']);
        let documentId=parseInt(rowElement.getAttribute('data-id'));
        webSkel.registry.currentDocumentId=documentId;
        await webSkel.changeToStaticPage(`documents/${documentId}`);
    }

    async deleteAction(_target){
        const rowElement = getClosestParentElement(_target, "document-item-renderer");
        let documentIdToRemove = parseInt(rowElement.getAttribute('data-id'));

        await webSkel.localStorage.deleteDocument(documentIdToRemove);
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
    afterRender() {

    }
}