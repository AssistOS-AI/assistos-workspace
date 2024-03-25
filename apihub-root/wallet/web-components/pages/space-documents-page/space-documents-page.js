export class SpaceDocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        system.factories.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(system.space.documents.length > 0) {
            system.space.documents.forEach((document) => {
                this.tableRows += `<space-document-unit data-name="${system.UI.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction"></space-document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return system.UI.reverseQuerySelector(_target, "space-document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await system.UI.showModal( "space-add-document-modal");
    }
    async editAction(_target) {
        let documentId = this.getDocumentId(_target);
        await system.UI.changeToDynamicPage("space-configs-page",`${system.space.id}/SpaceConfiguration/space-document-view-page/${documentId}`);
    }

    async deleteAction(_target){
        let flowId = system.space.getFlowIdByName("DeleteDocument");
        let context = {
            documentId: this.getDocumentId(_target)
        }
        await system.services.callFlow(flowId, context);
        system.factories.notifyObservers("docs");
    }
}