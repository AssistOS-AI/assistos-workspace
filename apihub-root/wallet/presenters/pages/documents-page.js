import { closeModal, showActionBox } from "../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";
import { showModal } from "../../utils/modal-utils.js";

export class documentsPage {
    constructor() {
        this.name = "Name";
        this.modal = "showAddNewDocumentModal";
        this.button = "Add document";
        if(company.documents) {
            this._documentConfigs = company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = company.documents;
            this.invalidate();
        }
        company.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if(this._documentConfigs) {
            if(this._documentConfigs.length === 0) {
                this.tableRows = `<div> No Data Currently </div>`;
            }
            else {
                this._documentConfigs.forEach((item) => {
                    this.tableRows += `<document-item-renderer data-name="${item.title}" data-id="${item.id}"></document-item-renderer>`;
                });
            }
        } else {
            this.tableRows = `<div> TBD:Encountered an error while trying to load the documents </div>`;
        }
    }

    async showAddNewDocumentModal() {
        await showModal(document.querySelector("body"), "add-new-document-modal", {});
    }

    async editAction(_target){
        let rowElement = getClosestParentElement(_target,['document-item-renderer']);
        let documentId= parseInt(rowElement.getAttribute('data-id'));
        company.observeDocument(documentId);
        await webSkel.changeToStaticPage(`documents/${documentId}`);
    }

    async deleteAction(_target){
        const rowElement = getClosestParentElement(_target, "document-item-renderer");
        let documentIdToRemove = parseInt(rowElement.getAttribute('data-id'));
        await company.deleteDocument(documentIdToRemove);
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        closeModal(_target);
    }
}