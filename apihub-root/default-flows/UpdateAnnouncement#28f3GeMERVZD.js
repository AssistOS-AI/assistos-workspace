export class UpdateAnnouncement {
    static id = "28f3GeMERVZD";
    static description = "Updates an announcement";
    constructor() {

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