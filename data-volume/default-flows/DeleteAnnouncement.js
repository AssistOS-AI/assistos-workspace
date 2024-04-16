export class DeleteAnnouncement {
    static description = "Deletes an announcement";
    async start(context) {
        try {
            await assistOS.space.deleteAnnouncement(context.announcementId);
            this.return(context.announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}