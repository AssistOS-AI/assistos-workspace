export class DeleteAnnouncement {
    static id = "7rppGd6eFR7b";

    constructor() {
        this.name = "DeleteAnnouncement";
        this.description = "Deletes an announcement";
    }

    async start(announcementId) {
        try {
            await webSkel.currentUser.space.deleteAnnouncement(announcementId);
            this.return(announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}