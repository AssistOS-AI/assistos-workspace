import {
    showActionBox,
    showModal,
    reverseQuerySelector,
    sanitize
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
        if(webSkel.currentUser.space.documents.length > 0) {
            webSkel.currentUser.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${sanitize(document.title)}" 
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
        webSkel.currentUser.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.changeToDynamicPage("document-view-page",`documents/${webSkel.currentUser.space.currentDocumentId}/document-view-page`);
    }
    async cloneAction(_target){
        webSkel.currentUser.space.currentDocumentId = this.getDocumentId(_target);
        await showModal(document.querySelector("body"), "clone-document-modal", { presenter: "clone-document-modal"});
    }
    async deleteAction(_target){
        await documentFactory.deleteDocument(webSkel.currentUser.space.id, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }
}