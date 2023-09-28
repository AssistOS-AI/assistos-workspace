import { DocumentModel, getClosestParentElement, showActionBox, showModal } from "../../../imports.js";

export class documentsPage {
    constructor() {
        if(webSkel.space.documents !== undefined) {
            setTimeout(()=> {
                this.invalidate();
                documentFactory.observeChange("docs", this.invalidate);
            }, 0);
        }

    }

    beforeRender() {
        this.tableRows = "";
        if(webSkel.space.documents.length === 0) {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
        else {
            webSkel.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${document.title}" data-id="${document.id}"></document-unit>`;
            });
        }
    }

    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", { presenter: "add-document-modal"});
    }

    async editAction(_target) {
        let rowElement = getClosestParentElement(_target,['document-unit']);
        let documentId = rowElement.getAttribute('data-id');
        webSkel.space.currentDocumentId = documentId;
        await webSkel.changeToStaticPage(`documents/${documentId}`);
    }

    async deleteAction(_target){
        const rowElement = getClosestParentElement(_target, "document-unit");
        let documentId = rowElement.getAttribute('data-id');
        await documentFactory.deleteDocument(currentSpaceId, documentId);
        documentFactory.notifyObservers("docs");
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}