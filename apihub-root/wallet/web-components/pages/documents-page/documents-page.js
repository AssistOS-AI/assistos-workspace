import { getClosestParentElement, showActionBox, showModal } from "../../../imports.js";

export class documentsPage {
    constructor() {
        if(webSkel.company.documents!==undefined) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = () => this.invalidate();
        webSkel.company.onChange(this.updateState);
    }
    beforeRender() {
        this.tableRows = "";
            if(webSkel.company.documents.length === 0) {
                this.tableRows = `<div> There are no documents yet </div>`;
            }
            else {
                webSkel.company.documents.forEach((document) => {
                    this.tableRows += `<document-unit data-name="${document.title}" data-id="${document.id}"></document-unit>`;
                });
            }
    }
    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", {presenter: "add-document-modal"});
    }

    async editAction(_target) {
        let rowElement = getClosestParentElement(_target,['document-unit']);
        let documentId = parseInt(rowElement.getAttribute('data-id'));
        webSkel.servicesRegistry.documentService.observeDocument(documentId);
        await webSkel.changeToStaticPage(`documents/${documentId}`);
    }

    async deleteAction(_target){
        const rowElement = getClosestParentElement(_target, "document-unit");
        let documentId = parseInt(rowElement.getAttribute('data-id'));
        await webSkel.servicesRegistry.documentService.deleteDocument(documentId);
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}