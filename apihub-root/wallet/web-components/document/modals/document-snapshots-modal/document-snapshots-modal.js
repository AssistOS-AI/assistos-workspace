const documentModule = assistOS.loadModule("document");
import {formatTimeAgo} from "../../../../utils/utils.js";
export class DocumentSnapshotsModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let documentsPage = document.querySelector("document-view-page");
        this.document = documentsPage.webSkelPresenter._document;
        this.invalidate();
    }
    async beforeRender() {
        this.snapshots = this.document.snapshots;
        if(this.document.type === documentModule.documentTypes.SNAPSHOT){
            let documentInfo = JSON.parse(assistOS.UI.unsanitize(this.document.abstract));
            this.snapshots = await documentModule.getDocumentSnapshots(assistOS.space.id, documentInfo.originalDocumentId);
            this.originalDocumentId = documentInfo.originalDocumentId;
        } else {
            this.originalDocumentId = this.document.id;
        }
        let snapshotsHTML = "";
        let headerHTML = `<div class="no-snapshots">no snapshots created</div>`;
        this.snapshots.sort((a, b) => b.timestamp - a.timestamp);
        if(this.snapshots.length > 0){
            headerHTML = `<div class="list-header">
                                        <span class="snapshot-date">Time</span>
                                        <span class="snapshot-user">Created by</span>
                                        <span>Action</span>
                                    </div>`;
            for (let snapshot of this.snapshots) {
                snapshotsHTML += `<div class="document-snapshot" data-id="${snapshot.documentId}">
                                          <div class="snapshot-date">${formatTimeAgo(snapshot.timestamp)}</div>
                                          <div class="snapshot-user">${snapshot.email}</div>
                                            <div class="action-box-snapshots" data-local-action="showSnapshotsOptions ${snapshot.id} ${snapshot.documentId}">
                                                <svg class="action-icon" width="4" height="16" viewBox="0 0 4 16" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 12C2.53043 12 3.03914 12.2107 3.41421 12.5858C3.78929 12.9609 4 13.4696 4 14C4 14.5304 3.78929 15.0391 3.41421 15.4142C3.03914 15.7893 2.53043 16 2 16C1.46957 16 0.960859 15.7893 0.585786 15.4142C0.210713 15.0391 -6.35145e-07 14.5304 -6.11959e-07 14C-5.88773e-07 13.4696 0.210714 12.9609 0.585786 12.5858C0.960859 12.2107 1.46957 12 2 12ZM2 6C2.53043 6 3.03914 6.21071 3.41421 6.58579C3.78929 6.96086 4 7.46957 4 8C4 8.53043 3.78929 9.03914 3.41421 9.41421C3.03914 9.78929 2.53043 10 2 10C1.46957 10 0.960859 9.78929 0.585786 9.41421C0.210714 9.03914 -3.72877e-07 8.53043 -3.49691e-07 8C-3.26505e-07 7.46957 0.210714 6.96086 0.585787 6.58579C0.960859 6.21071 1.46957 6 2 6ZM2 -8.74228e-08C2.53043 -6.42368e-08 3.03914 0.210714 3.41421 0.585786C3.78929 0.960859 4 1.46957 4 2C4 2.53043 3.78929 3.03914 3.41421 3.41421C3.03914 3.78929 2.53043 4 2 4C1.46957 4 0.960859 3.78929 0.585787 3.41421C0.210714 3.03914 -1.10609e-07 2.53043 -8.74228e-08 2C-6.42368e-08 1.46957 0.210714 0.960859 0.585787 0.585786C0.96086 0.210713 1.46957 -1.10609e-07 2 -8.74228e-08Z"
                                                      fill="#494949"/>
                                                </svg>
                                            </div>
                                     </div>`;
            }
        }
        this.snapshotsHTML=`${headerHTML}${snapshotsHTML}`;
    }
    afterRender() {
        if(this.document.type === documentModule.documentTypes.SNAPSHOT){
            let currentVersionButton = this.element.querySelector(".current-version");
            currentVersionButton.style.display = "block";
            let snapshotItem = this.element.querySelector(`.document-snapshot[data-id="${this.document.id}"]`);
            snapshotItem.classList.add("current-snapshot-version");
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
        let snapshot = await documentModule.addDocumentSnapshot(assistOS.space.id, this.originalDocumentId, snapshotData);
        this.snapshots.push(snapshot);
        this.invalidate();
    }
    async deleteSnapshot(targetElement, snapshotId){
        let message = "Are you sure you want to delete this snapshot?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await documentModule.deleteDocumentSnapshot(assistOS.space.id, this.originalDocumentId, snapshotId);
        this.snapshots = this.snapshots.filter(snapshot => snapshot.id !== snapshotId);
        this.invalidate();
    }
    async openSnapshot(targetElement, documentId){
        this.closeModal();
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }
    showSnapshotsOptions(targetElement, snapshotId, snapshotDocumentId) {
        let chapterOptions = `<action-box-snapshot data-id="${snapshotId}" data-document-id="${snapshotDocumentId}"></action-box-chapter>`;
        targetElement.insertAdjacentHTML("afterbegin", chapterOptions);
        let controller = new AbortController();
        this.boundHideChapterOptions = this.hideSnapshotsOptions.bind(this, controller);
        document.addEventListener('click', this.boundHideChapterOptions, {signal: controller.signal});
    }
    hideSnapshotsOptions(controller, event) {
        controller.abort();
        let options = this.element.querySelector(`action-box-snapshot`);
        if (options) {
            options.remove();
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    async restoreSnapshot(targetElement, snapshotId, snapshotDocumentId){
        let snapshotData = {
            timestamp: Date.now(),
            email: assistOS.user.email
        }
        await documentModule.restoreDocumentSnapshot(assistOS.space.id, this.originalDocumentId, snapshotId, snapshotData);
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/document-view-page/${this.originalDocumentId}`);
        this.closeModal();
    }
}