export class SpaceDocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        assistOS.space.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.refreshDocuments = async () =>{
            this.documents = await assistOS.space.getDocumentsMetadata();
        }
        this.invalidate(this.refreshDocuments);
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
    setContext(){
        assistOS.context = {
            "location and available actions": "We are in the Documents page in OS. Here you can see the documents available for the space. You can add or delete documents.",
            "available items": assistOS.space.documents.map((document)=>{
                return {title:document.title, abstract:document.abstract, id:document.id}
            })
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
        await assistOS.UI.changeToDynamicPage("space-configs-page",`${assistOS.space.id}/SpaceConfiguration/space-document-view-page/${documentId}`);
    }

    async deleteAction(_target){
        await assistOS.callFlow("DeleteDocument", {
            spaceId: assistOS.space.id,
            documentId: this.getDocumentId(_target)
        });
       this.invalidate(this.refreshDocuments);
    }
}