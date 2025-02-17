const documentModule = require("assistos").loadModule("document", {});
const spaceModule = require("assistos").loadModule("space", {});
export class DocumentSnapshotsModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentsPage = document.querySelector("document-view-page");
        this.document = documentsPage.webSkelPresenter._document;
        this.invalidate();
    }
    async beforeRender() {
        let snapshotsHTML = "";
        let headerHTML = `<div class="no-snapshots">no snapshots created</div>`;
        if(this.document.snapshots.length > 0){
            headerHTML = `<div class="list-header">
                                        <span class="snapshot-date">Date</span>
                                        <span class="snapshot-user">Created by</span>
                                        <span class="export-snapshot">Export</span>
                                        <span>Delete</span>
                                    </div>`;
            for (let snapshot of this.document.snapshots) {
                snapshotsHTML += `<div class="document-snapshot">
                                          <div class="snapshot-date">${snapshot.date}</div>
                                          <div class="snapshot-user">${snapshot.userEmail}</div>
                                          <img class="export-document pointer" data-local-action="exportDocument ${snapshot.id}" src="./wallet/assets/icons/download.svg" alt="download">
                                          <img class="delete-snapshot pointer" data-local-action="deleteSnapshot ${snapshot.id}" src="./wallet/assets/icons/trash-can.svg" alt="delete">
                                        </div>`;
            }
        }
        this.snapshotsHTML=`${headerHTML}${snapshotsHTML}`;
    }
    afterRender() {

    }
    closeModal() {
        assistOS.UI.closeModal(this.element);
    }
    async addSnapshot(){
        let snapshotData = {
            timestamp: Date.now(),
            email: assistOS.user.email
        }
        await documentModule.addDocumentSnapshot(assistOS.space.id, this.document.id, snapshotData);
        this.document.snapshots = await documentModule.getDocumentSnapshots(assistOS.space.id, this.document.id);
        this.invalidate();
    }
    async deleteSnapshot(snapshotId){
        await documentModule.deleteDocumentSnapshot(assistOS.space.id, this.document.id, snapshotId);
        this.document.snapshots.filter(snapshot => snapshot.id !== snapshotId);
        this.invalidate();
    }
}