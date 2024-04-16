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
            let docId = await assistOS.space.addDocument(docData);
            this.return(docId);
        } catch (e) {
            this.fail(e);
        }
    }
}