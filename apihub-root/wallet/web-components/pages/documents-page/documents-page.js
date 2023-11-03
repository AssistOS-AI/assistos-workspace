import {
    showActionBox,
    showModal,
    reverseQuerySelector
} from "../../../imports.js";

export class documentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        documentFactory.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(webSkel.space.documents.length > 0) {
            webSkel.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${document.title}" 
                data-id="${document.id}" data-local-action="editAction"></document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", { presenter: "add-document-modal"});
    }
    async showGenerateDocumentModal() {
        await showModal(document.querySelector("body"), "generate-document-modal", { presenter: "generate-document-modal"});
    }
    async editAction(_target) {
        webSkel.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.changeToDynamicPage("document-view-page",`documents/${webSkel.space.currentDocumentId}/document-view-page`);
    }
    async cloneAction(_target){
        webSkel.space.currentDocumentId = this.getDocumentId(_target);
        await showModal(document.querySelector("body"), "clone-document-modal", { presenter: "clone-document-modal"});
    }
    async deleteAction(_target){
        await documentFactory.deleteDocument(currentSpaceId, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }
}