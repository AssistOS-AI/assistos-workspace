const spaceAPIs = require("assistos").loadModule("space", {});
const utilModule = require("assistos").loadModule("util", {});

export class DocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs";
        this.refreshDocuments = async () => {
            this.documents = await assistOS.space.getDocumentsMetadata(assistOS.space.id);
        };
        this.invalidate = invalidate;
        this.id = "documents";
        this.invalidate(async () => {
            await this.refreshDocuments();
            await utilModule.subscribeToObject(this.id, (data) => {
                this.invalidate(this.refreshDocuments);
            });
        });
    }

    beforeRender() {
        this.tableRows = "";
        if (this.documents.length > 0) {
            this.documents.forEach((document) => {
                this.tableRows += `<document-item data-name="${document.title}" 
                data-id="${document.id}" data-local-action="editAction"></document-item>`;
            });
        } else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }

    afterRender() {
        this.setContext();
    }

    async afterUnload() {
        await utilModule.unsubscribeFromObject(this.id);
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
        return assistOS.UI.reverseQuerySelector(_target, "document-item").getAttribute("data-name");
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
        try {
            const documentId=this.getDocumentId(_target);
            const response = await fetch(`/spaces/${assistOS.space.id}/export/documents/${documentId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/zip'
                }
            });

            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `${this.getDocumentTitle(_target)}.docai`;

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
        }
    }
    async importDocument(_target) {
        const handleFile = async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const importResult = await spaceAPIs.importDocument(assistOS.space.id, formData);
            if (importResult.overriddenPersonalities.length > 0) {
                /* TODO use notification system */
                alert("The document has been imported. The following personalities have been overridden: " + importResult.overriddenPersonalities.join(", "));
            }
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
                    this.invalidate(this.refreshDocuments);
                    document.body.appendChild(fileInput);
                    fileInput.remove();
                } else {
                    alert('Only a .docai files are allowed!');
                }
            }
        };
        fileInput.click();
    }
}
