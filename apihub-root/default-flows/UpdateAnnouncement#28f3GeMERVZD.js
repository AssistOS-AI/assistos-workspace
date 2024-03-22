export class UpdateAnnouncement {
    static id = "28f3GeMERVZD";
    static description = "Updates an announcement";
    constructor() {

    }

    async start(context) {
        try {
            await system.space.updateAnnouncement(context.announcementId, context.title, context.text);
            this.return(context.announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}