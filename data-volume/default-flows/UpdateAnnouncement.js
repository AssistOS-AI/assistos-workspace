export class UpdateAnnouncement {
    static id = "28f3GeMERVZD";
    static description = "Updates an announcement";
    async start(context) {
        try {
            let spaceModule = await this.loadModule("space");
            await spaceModule.updateAnnouncement(context.spaceId, context.announcementId, context.announcementObj);
            this.return(context.announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}