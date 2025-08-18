const documentModule = assistOS.loadModule("document");
const constants = require("assistos").constants;
export class DocumentsPage {
    constructor(element, invalidate) {
        this.selectedCtegory = "";
        this.refreshDocuments = async () => {
            this.Alldocuments = await documentModule.getDocuments(assistOS.space.id);
            if(this.selectedCtegory === "") {
                this.documents = this.Alldocuments;
            } else {
                this.documents = this.Alldocuments.filter(document => document.category === this.selectedCtegory);
            }
        };
        this.invalidate = invalidate;
        this.id = "documents";
        this.invalidate(async () => {
            await this.refreshDocuments();
        });
    }

    beforeRender() {
        this.tableRows = "";
        this.documents.forEach((document) => {
            this.tableRows += `<document-item data-presenter="document-item" data-id="${document.id}" data-local-action="editAction"></document-item>`;
        });
        if (assistOS.space.loadingDocuments) {
            assistOS.space.loadingDocuments.forEach((taskId) => {
                this.tableRows += `<div data-id="${taskId}" class="placeholder-document">
                <div class="loading-icon small"></div>
            </div>`;
            });
        }
        if (this.tableRows === "") {
            this.tableRows = `<div class="no-documents"> There are no documents yet </div>`;
        }
    }

    afterRender() {

        let documentTypesOptions = [{name: "All", value: ""}];
        for(let category of Object.keys(constants.DOCUMENT_CATEGORIES)) {
            documentTypesOptions.push({
                name: category,
                value: constants.DOCUMENT_CATEGORIES[category]
            })
        }
        assistOS.UI.createElement("custom-select", ".select-container", {
                options: documentTypesOptions,
            },
            {
                "data-width": "230",
                "data-name": "type",
                "data-selected": this.selectedCtegory,
            })
        let customSelect = document.querySelector("custom-select");
        customSelect.addEventListener("change", (event)=>{
            if(event.value === this.selectedCtegory) {
                return;
            }
            this.selectedCtegory = event.value;
            if(this.selectedCtegory === "") {
                this.documents = this.Alldocuments;
            } else {
                this.documents = this.Alldocuments.filter(document => document.category === this.selectedCtegory);
            }
            this.invalidate();
        });

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
        await assistOS
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }

    async deleteAction(_target) {
        let message = "Are you sure you want to delete this document?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await documentModule.deleteDocument(assistOS.space.id, this.getDocumentId(_target));
        this.invalidate(this.refreshDocuments);
    }

    async exportAction(_target) {
        const documentId = this.getDocumentId(_target);
        const documentTitle = assistOS.UI.reverseQuerySelector(_target, "document-item").getAttribute("data-name");
        await assistOS.UI.showModal("export-document-modal", {id: documentId, title: documentTitle});
    }

    async printDocument(eventTarget){
        let documentId = this.getDocumentId(eventTarget);
        await assistOS.UI.showModal("print-document-modal", {documentId: documentId});
    }

    async importDocument(_target) {
        const handleFile = async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const taskId = await documentModule.importDocument(assistOS.space.id, formData);
            fileInput.remove();
            if (!assistOS.space.loadingDocuments) {
                assistOS.space.loadingDocuments = [];
            }
            assistOS.space.loadingDocuments.push(taskId);

            if(!this.boundOnImportFinish){
                this.onImportFinish = (importResult) => {
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
                    this.invalidate(this.refreshDocuments);
                }
                this.boundOnImportFinish = this.onImportFinish.bind(this);
            }

            //await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, taskId, this.boundOnImportFinish);
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
    async translateDocument(_target){
        let documentId = this.getDocumentId(_target);
        await assistOS.UI.showModal("translate-document-modal", {id: documentId});
    }
}
