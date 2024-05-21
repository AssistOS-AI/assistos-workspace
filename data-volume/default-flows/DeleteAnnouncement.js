class DeleteAnnouncement {
    static description = "Deletes an announcement";
    async start(context) {
        try {
            let spaceModule = await this.loadModule("space");
            await spaceModule.deleteAnnouncement(context.spaceId, context.announcementId);
            this.return(context.announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = DeleteAnnouncement;