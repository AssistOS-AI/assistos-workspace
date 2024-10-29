const documentModule = require("assistos").loadModule("document", {});
import {NotificationRouter} from "../../../../imports.js";
export class DocumentsPage {
    constructor(element, invalidate) {
        this.refreshDocuments = async () => {
            this.documents = await assistOS.space.getDocumentsMetadata(assistOS.space.id);
        };
        this.invalidate = invalidate;
        this.id = "documents";
        this.invalidate(async () => {
            await this.refreshDocuments();
            await NotificationRouter.subscribeToSpace(assistOS.space.id, this.id, async (data) => {
                this.invalidate(this.refreshDocuments);
            })
        });
    }

    beforeRender() {
        this.tableRows = "";
        this.documents.forEach((document) => {
            this.tableRows += `<document-item data-name="${document.title}" 
            data-id="${document.id}" data-local-action="editAction"></document-item>`;
        });
        if (assistOS.space.loadingDocuments) {
            assistOS.space.loadingDocuments.forEach((taskId) => {
                this.tableRows += `<div data-id="${taskId}" class="placeholder-document">
                <div class="loading-icon small"></div>
            </div>`;
            });
        }
        if (this.tableRows === "") {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }

    afterRender() {
        this.setContext();
    }

    async afterUnload() {
        //await utilModule.unsubscribeFromObject(this.id);
    }

    setContext() {
        assistOS.context = {
            "location and available actions": "We are in the Documents page in OS. Here you can see the documents available for the space. You can add or delete documents.",
            "available items": this.documents
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getDocumentId(_target) {
        return assistOS.UI.reverseQuerySelector(_target, "document-item").getAttribute("data-id");
    }

    getDocumentTitle(_target) {
        return assistOS.UI.unsanitize(assistOS.UI.reverseQuerySelector(_target, "document-item").getAttribute("data-name"));
    }

    async showAddDocumentModal() {
        await assistOS.UI.showModal("add-document-modal");
    }

    async editAction(_target) {
        let documentId = this.getDocumentId(_target);
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }

    async deleteAction(_target) {
        await assistOS.callFlow("DeleteDocument", {
            spaceId: assistOS.space.id,
            documentId: this.getDocumentId(_target)
        });
        this.invalidate(this.refreshDocuments);
    }

    async exportAction(_target) {
        const documentId = this.getDocumentId(_target);
        const documentTitle = assistOS.UI.reverseQuerySelector(_target, "document-item").getAttribute("data-name");
        await assistOS.UI.showModal("export-document-modal", {id: documentId, title: documentTitle});
    }

    async importDocument(_target) {
        const handleFile = async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const taskId = await documentModule.importDocument(assistOS.space.id, formData);
            if (!assistOS.space.loadingDocuments) {
                assistOS.space.loadingDocuments = [];
            }
            assistOS.space.loadingDocuments.push(taskId);
            await utilModule.subscribeToObject(taskId, async (importResult) => {
                if (importResult.error) {
                    alert("An error occurred while importing the document: " + importResult.error);
                } else if (importResult.overriddenPersonalities) {
                    /* TODO use notification system */
                    if (importResult.overriddenPersonalities.length > 0) {
                        alert("The document has been imported. The following personalities have been overridden: " + importResult.overriddenPersonalities.join(", "));
                    }
                    assistOS.space.loadingDocuments = assistOS.space.loadingDocuments.filter((taskId) => taskId !== taskId);
                    let placeholder = document.querySelector(`.placeholder-document[data-id="${taskId}"]`);
                    if (placeholder) {
                        placeholder.remove();
                    }
                }
                await utilModule.unsubscribeFromObject(taskId);
                this.invalidate(this.refreshDocuments);
                //TODO navigating to another page and back changes the instance of the presenter, beforeRender doesnt do anything
                fileInput.remove();
            });
            this.invalidate(this.refreshDocuments);
        }
        let fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.docai';
        fileInput.style.display = 'none';
        fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.name.endsWith('.docai')) {
                    await handleFile(file);
                } else {
                    alert('Only a .docai files are allowed!');
                }
            }
        };
        fileInput.click();
    }
}
