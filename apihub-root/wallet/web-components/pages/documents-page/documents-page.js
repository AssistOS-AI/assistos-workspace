import { getClosestParentElement, closeModal, showActionBox, showModal } from "../../../imports.js";

export class documentsPage {
    constructor() {
        this.name = "Name";
        this.modal = "showAddDocumentModal";
        this.button = "Add document";
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.documentService = webSkel.getService('documentService');
    }

    beforeRender() {
        this.tableRows = "";
        if(this._documentConfigs) {
            if(this._documentConfigs.length === 0) {
                this.tableRows = `<div> No Data Currently </div>`;
            }
            else {
                this._documentConfigs.forEach((item) => {
                    this.tableRows += `<document-unit data-name="${item.title}" data-id="${item.id}"></document-unit>`;
                });
            }
        } else {
            this.tableRows = `<div> TBD:Encountered an error while trying to load the documents </div>`;
        }
    }

    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", {});
    }

    async editAction(_target) {
        let rowElement = getClosestParentElement(_target,['document-unit']);
        let documentId = parseInt(rowElement.getAttribute('data-id'));
        // webSkel.company.currentDocumentId = documentId;
        this.documentService.observeDocument(documentId);
        await webSkel.changeToStaticPage(`documents/${documentId}`);
    }

    async deleteAction(_target){
        const rowElement = getClosestParentElement(_target, "document-unit");
        let documentIdToRemove = parseInt(rowElement.getAttribute('data-id'));
        await this.documentService.deleteDocument(documentIdToRemove);
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}