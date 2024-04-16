export class DeleteAnnouncement {
    static id = "7rppGd6eFR7b";
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