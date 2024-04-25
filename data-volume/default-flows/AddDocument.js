export class AddDocument {
    static description = "Adds a new document, article or any kind of paperwork";
    static inputSchema= {
            title: "string",
    }
    async start(context) {
        try {
            let docData = {
                title: context.title,
                topic: context.topic,
            };
            let documentModule = this.loadModule("document");
            let userModule = this.loadModule("space");
            let spaceId = userModule.getCurrentSpaceId();
            let docId = await documentModule.addDocument(spaceId, docData);
            this.return(docId);
        } catch (e) {
            this.fail(e);
        }
    }
}