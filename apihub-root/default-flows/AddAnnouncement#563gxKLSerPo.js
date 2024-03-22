export class AddAnnouncement {
    static id = "563gxKLSerPo";
    static description = "Adds a new announcement to the current space, a title and text are needed";
    static inputSchema = {
        title: "string",
        text: "string",
    };
    constructor() {

    }

    async start(context) {
        try {
            let announcementData = {
                title: context.title,
                text: context.text,
                date: new Date().toISOString().split('T')[0],
            };
            await system.space.addAnnouncement(announcementData);
            this.return(announcementData);
        } catch (e) {
            this.fail(e);
        }
    }
}