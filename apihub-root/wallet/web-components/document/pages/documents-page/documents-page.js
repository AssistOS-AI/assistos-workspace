const spaceAPIs = require("assistos").loadModule("space", {});
const utilModule = require("assistos").loadModule("util", {});
export class DocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs";
        this.refreshDocuments = async ()=>{
            this.documents = await assistOS.space.getDocumentsMetadata(assistOS.space.id);
        };
        this.invalidate = invalidate;
        this.id = "documents";
        this.invalidate(async () => {
            await this.refreshDocuments();
            await utilModule.subscribeToObject(this.id,(data)=>{
                this.invalidate(this.refreshDocuments);
            });
        });
    }
    beforeRender() {
        this.tableRows = "";
        if(this.documents.length > 0) {
            this.documents.forEach((document) => {
                this.tableRows += `<document-item data-name="${document.title}" 
                data-id="${document.id}" data-local-action="editAction"></document-item>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    afterRender(){
        this.setContext();
    }
    async afterUnload() {
        await utilModule.unsubscribeFromObject(this.id);
    }
    setContext(){
        assistOS.context = {
            "location and available actions": "We are in the Documents page in OS. Here you can see the documents available for the space. You can add or delete documents.",
            "available items": this.documents
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return assistOS.UI.reverseQuerySelector(_target, "document-item").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await assistOS.UI.showModal( "add-document-modal");
    }
    async editAction(_target) {
        let documentId = this.getDocumentId(_target);
        await assistOS.UI.changeToDynamicPage("space-application-page",`${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }

    async deleteAction(_target){
        await assistOS.callFlow("DeleteDocument", {
            spaceId: assistOS.space.id,
            documentId: this.getDocumentId(_target)
        });
       this.invalidate(this.refreshDocuments);
    }
}