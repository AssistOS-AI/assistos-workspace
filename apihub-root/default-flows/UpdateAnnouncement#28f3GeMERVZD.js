export class UpdateAnnouncement {
    static id = "28f3GeMERVZD";
    static description = "Updates an announcement";
    constructor() {

    }

    async start(announcementId, title, text) {
        try {
            await system.space.updateAnnouncement(announcementId, title, text);
            this.return(announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}