class AddDocument {
    static description = "Adds a new document, article or any kind of paperwork";
    static inputSchema= {
        topic:"string",
        title: "string",
    }
    async start(context) {
        try {
            let docData = {
                title: context.title,
                topic: context.topic,
            };
            let documentModule = assistOS.loadModule("document");
            let docId = await documentModule.addDocument(assistOS.space.id, docData);
            this.return(docId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddDocument;