import {showActionBox, showModal } from "../../../imports.js";
import {reverseQuerySelector} from "../../../../WebSkel/utils/dom-utils.js";

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


    getDocumentId(_target){
        return reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await showModal(document.querySelector("body"), "add-document-modal", { presenter: "add-document-modal"});
    }
    async editAction(_target) {
        webSkel.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.changeToStaticPage(`documents/${webSkel.space.currentDocumentId}`);
    }

    async deleteAction(_target){
        await documentFactory.deleteDocument(currentSpaceId, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}