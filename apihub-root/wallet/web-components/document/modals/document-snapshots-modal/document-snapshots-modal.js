import {generateId} from "../../../../imports.js";
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
        let snapshots = Object.values(this.document.snapshots);
        if(snapshots.length > 0){
            headerHTML = `<div class="list-header">
                                        <span class="snapshot-date">Date</span>
                                        <span class="snapshot-user">Created by</span>
                                        <span class="export-snapshot">Export</span>
                                        <span>Delete</span>
                                    </div>`;
            for (let snapshot of snapshots) {
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
        let snapshotId = generateId();
        let documentClone = JSON.parse(JSON.stringify(this.document));
        documentClone.snapshotId = snapshotId;
        await spaceModule.addContainerObject(assistOS.space.id, "documentSnapshots", snapshotId, documentClone);
        this.document.snapshots[snapshotId] = { id: snapshotId, timestamp: Date.now(), userEmail: assistOS.user.email };
        await documentModule.updateDocumentSnapshots(assistOS.space.id, this.document.id, this.document.snapshots);
    }
}