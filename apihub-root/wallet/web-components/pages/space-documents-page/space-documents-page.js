const spaceAPIs = require("assistos").loadModule("space");
const documentModule = require("assistos").loadModule("document");
const {notificationService} = require("assistos").loadModule("util");
export class SpaceDocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs";
        this.refreshDocuments = async ()=>{
            this.documents = await assistOS.space.getDocumentsMetadata(assistOS.space.id);
        };
        this.invalidate = invalidate;
        this.invalidate(async () => {
            await this.refreshDocuments();
            await spaceAPIs.subscribeToObject(assistOS.space.id, this.id);
            spaceAPIs.startCheckingUpdates(assistOS.space.id);
        });
        this.id = "documents";
        notificationService.on(this.id, ()=>{
            this.invalidate(this.refreshDocuments);
        });
    }
    beforeRender() {
        this.tableRows = "";
        if(this.documents.length > 0) {
            this.documents.forEach((document) => {
                this.tableRows += `<space-document-unit data-name="${assistOS.UI.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction"></space-document-unit>`;
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
        await spaceAPIs.unsubscribeFromObject(assistOS.space.id, this.id);
        spaceAPIs.stopCheckingUpdates(assistOS.space.id);
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
        return assistOS.UI.reverseQuerySelector(_target, "space-document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await assistOS.UI.showModal( "space-add-document-modal");
    }
    async editAction(_target) {
        let documentId = this.getDocumentId(_target);
        await assistOS.UI.changeToDynamicPage("space-configs-page",`${assistOS.space.id}/Space/space-document-view-page/${documentId}`);
    }

    async deleteAction(_target){
        await assistOS.callFlow("DeleteDocument", {
            spaceId: assistOS.space.id,
            documentId: this.getDocumentId(_target)
        });
       this.invalidate(this.refreshDocuments);
    }
}