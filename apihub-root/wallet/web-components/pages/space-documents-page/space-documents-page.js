export class SpaceDocumentsPage {
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
                this.tableRows += `<space-document-unit data-name="${webSkel.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction"></space-document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await webSkel.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return webSkel.reverseQuerySelector(_target, "space-document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await webSkel.showModal( "space-add-document-modal");
    }
    async editAction(_target) {
        let documentId = this.getDocumentId(_target);
        await webSkel.changeToDynamicPage("space-configs-page",`${webSkel.currentUser.space.id}/SpaceConfiguration/space-document-view-page/${documentId}`);
    }

    async deleteAction(_target){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteDocument");
        await webSkel.appServices.callFlow(flowId, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }
}