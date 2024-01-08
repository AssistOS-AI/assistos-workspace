export class AddAnnouncement {
    static id = "563gxKLSerPo";

    constructor() {
        this.name = "AddAnnouncement";
        this.description = "Adds a new announcement";
        this.agentConfigs = {
            description: "Adds a new announcement to the current space, a title and text are needed",
            parameters: [
                { name: "title", type: "string", description: "The title of the announcement.", optional: false },
                { name: "text", type: "string", description: "The text content of the announcement.", optional: false }
            ]
        };
    }

    async start(title, text) {
        try {
            let announcementData = {
                title: title,
                text: text,
                date: new Date().toISOString().split('T')[0],
            };
            await webSkel.currentUser.space.addAnnouncement(announcementData);
            this.return(announcementData);
        } catch (e) {
            this.fail(e);
        }
    }
}