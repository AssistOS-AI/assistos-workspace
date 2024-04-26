export class AddDocument {
    static description = "Adds a new document, article or any kind of paperwork";
    static inputSchema= {
        spaceId: "string",
        title: "string",
    }
    async start(context) {
        try {
            let docData = {
                title: context.title,
                topic: context.topic,
            };
            let documentModule = this.loadModule("document");
            let docId = await documentModule.addDocument(context.spaceId, docData);
            this.return(docId);
        } catch (e) {
            this.fail(e);
        }
    }
}