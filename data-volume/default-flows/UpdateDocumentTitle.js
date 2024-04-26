export class UpdateDocumentTitle {
    static description = "Updates the title of a document";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        title: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.updateDocumentTitle(context.spaceId, context.documentId, context.title);
            this.return(context.title);
        } catch (e) {
            this.fail(e);
        }
    }
}