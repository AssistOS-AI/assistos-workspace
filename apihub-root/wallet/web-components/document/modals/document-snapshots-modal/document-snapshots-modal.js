const documentModule = require("assistos").loadModule("document", {});
import {formatTimestampToDate} from "../../../../utils/utils.js";
export class DocumentSnapshotsModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentsPage = document.querySelector("document-view-page");
        this.document = documentsPage.webSkelPresenter._document;
        this.invalidate();
    }
    async beforeRender() {
        let snapshots = this.document.snapshots;
        if(this.document.type === documentModule.documentTypes.SNAPSHOT){
            let documentInfo = JSON.parse(this.document.abstract);
            snapshots = await documentModule.getDocumentSnapshots(assistOS.space.id, documentInfo.originalDocumentId);
            snapshots.push({
                documentId: documentInfo.originalDocumentId
            })
        }
        let snapshotsHTML = "";
        let headerHTML = `<div class="no-snapshots">no snapshots created</div>`;
        snapshots.sort((a, b) => b.timestamp - a.timestamp);
        if(snapshots.length > 0){
            headerHTML = `<div class="list-header">
                                        <span class="snapshot-date">Date</span>
                                        <span class="snapshot-user">Created by</span>
                                        <span>Delete</span>
                                    </div>`;
            for (let snapshot of snapshots) {
                snapshotsHTML += `<div class="document-snapshot" data-local-action="openSnapshot ${snapshot.documentId}">
                                          <div class="snapshot-date">${formatTimestampToDate(snapshot.timestamp)}</div>
                                          <div class="snapshot-user">${snapshot.email}</div>
                                          <img class="delete-snapshot pointer" data-local-action="deleteSnapshot ${snapshot.id}" src="./wallet/assets/icons/trash-can.svg" alt="delete">
                                        </div>`;
            }
        }
        this.snapshotsHTML=`${headerHTML}${snapshotsHTML}`;
    }
    afterRender() {
        let snapshotButton = this.element.querySelector(".snapshot-button");
        if(this.document.type === documentModule.documentTypes.SNAPSHOT){
            snapshotButton.classList.add("disabled");
        }
    }
    closeModal() {
        assistOS.UI.closeModal(this.element);
    }
    async addSnapshot(){
        let snapshotData = {
            timestamp: Date.now(),
            email: assistOS.user.email
        }
        let snapshot = await documentModule.addDocumentSnapshot(assistOS.space.id, this.document.id, snapshotData);
        this.document.snapshots.push(snapshot);
        this.invalidate();
    }
    async deleteSnapshot(targetElement, snapshotId){
        let message = "Are you sure you want to delete this snapshot?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await documentModule.deleteDocumentSnapshot(assistOS.space.id, this.document.id, snapshotId);
        this.document.snapshots = this.document.snapshots.filter(snapshot => snapshot.id !== snapshotId);
        this.invalidate();
    }
    openSnapshot(targetElement, documentId){
        this.closeModal();
        assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }
}