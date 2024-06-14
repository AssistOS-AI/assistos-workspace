export class AnnouncementsPage {
    constructor(element,invalidate) {
        assistOS.space.observeChange(assistOS.space.getNotificationId(),invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.announcementsContainer = "";
        if(assistOS.space.announcements.length>0) {
            assistOS.space.announcements.forEach((announcement) => {
                this.announcementsContainer += `<announcement-item data-title="${announcement.title}" 
                data-content="${announcement.text}" data-date="${announcement.date}" 
                data-id="${announcement.id}" data-local-action="editAction"></announcement-item>`;
            });
        }else{
            this.announcementsContainer=`<div class="no-data-loaded">No announcements for now</div>`;
        }
    }
    afterRender(){
        this.setContext();
    }
    setContext(){
        assistOS.context = {
            "location and available actions": "We are in the Rules and Announcements page in OS. Here you can add announcements.",
            "available items": assistOS.space.announcements.map((announcement)=>announcement.simplify())
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    getAnnouncementId(_target){
        return assistOS.UI.reverseQuerySelector(_target, "announcement-item").getAttribute("data-id");
    }
    async showAddAnnouncementModal() {
        await assistOS.UI.showModal( "add-announcement-modal", { presenter: "add-announcement-modal"});
    }
    async deleteAction(_target){
        const announcementId=assistOS.UI.reverseQuerySelector(_target, "announcement-item").getAttribute("data-id");
        const spaceModule =assistOS.loadModule("space");
        await spaceModule.deleteSpaceAnnouncement(assistOS.space.id,announcementId);
        this.invalidate();
    }
    async editAction(_target){
        await assistOS.UI.showModal("edit-announcement-modal", { presenter: "edit-announcement-modal", id: this.getAnnouncementId(_target)});
    }
}