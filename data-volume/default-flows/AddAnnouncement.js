class AddAnnouncement {
    static description = "Adds a new announcement to the current space, a title and text are needed";
    static inputSchema = {
        title: "string",
        text: "string",
    };
    async start(context) {
        try {
            let spaceModule = await this.loadModule("space");
            let announcementData = {
                title: context.title,
                text: context.text,
                date: new Date().toISOString().split('T')[0],
            };
            await spaceModule.addAnnouncement(announcementData);
            this.return(announcementData);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddAnnouncement;