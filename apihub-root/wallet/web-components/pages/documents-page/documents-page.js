import { DocumentModel, getClosestParentElement, showActionBox, showModal } from "../../../imports.js";

export class documentsPage {
    constructor() {
        if(webSkel.space.documents !== undefined) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = () => this.invalidate();
    }

    beforeRender() {
        this.tableRows = "";
        if(webSkel.space.documents.length === 0) {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
        else {
            webSkel.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${document.title}" data-id="${document.id}"></document-unit>`;
                document.observeChange(document.getNotifyId(), this.updateState);
            });
        }
    }

    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", { presenter: "add-document-modal"});
    }

    async editAction(_target) {
        let rowElement = getClosestParentElement(_target,['document-unit']);
        let documentId = parseInt(rowElement.getAttribute('data-id'));
        webSkel.space.currentDocumentId = documentId;
        await webSkel.changeToStaticPage(`documents/${documentId}`);
    }

    async deleteAction(_target){
        const rowElement = getClosestParentElement(_target, "document-unit");
        let documentId = parseInt(rowElement.getAttribute('data-id'));

        webSkel.space.deleteDocument(documentId);
        await storageManager.storeObject(currentSpaceId, "documents", documentId, "");
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}