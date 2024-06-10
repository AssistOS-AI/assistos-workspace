class AddAnnouncement {
    static description = "Adds a new announcement to the current space, a title and text are needed";
    static inputSchema = {
        title: "string",
        text: "string",
    };
    async start(context) {
        try {
            let spaceModule=assistOS.loadModule("space");
            let announcementData = {
                title: context.title,
                text: context.text,
            };
            await spaceModule.addSpaceAnnouncement(assistOS.space.id,announcementData);
            this.return(announcementData);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddAnnouncement;