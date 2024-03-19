export class DeleteAnnouncement {
    static id = "7rppGd6eFR7b";
    static description = "Deletes an announcement";
    constructor() {

    }

    async start(announcementId) {
        try {
            await system.space.deleteAnnouncement(announcementId);
            this.return(announcementId);
        } catch (e) {
            this.fail(e);
        }
    }
}