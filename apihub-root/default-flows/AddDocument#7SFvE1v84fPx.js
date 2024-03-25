export class AddDocument {
    static id = "7SFvE1v84fPx";
    static description = "Adds a new document, article or any kind of paperwork";
    static inputSchema= {
            title: "string",
            topic: "string",
    }
    constructor() {

    }

    async start(context) {
        try {
            let docData = {
                title: context.title,
                topic: context.topic,
            };
            let docId = await system.space.addDocument(docData);
            this.return(docId);
        } catch (e) {
            this.fail(e);
        }
    }
}