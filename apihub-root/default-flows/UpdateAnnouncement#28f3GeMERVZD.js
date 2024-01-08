export class UpdateAnnouncement {
    static id = "28f3GeMERVZD";

    constructor() {
        this.name = "UpdateAnnouncement";
        this.description = "Updates an announcement";
    }

    async start(announcementId, text) {
        try {
            await webSkel.currentUser.space.updateAnnouncement(announcementId, text);
            this.return(announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}