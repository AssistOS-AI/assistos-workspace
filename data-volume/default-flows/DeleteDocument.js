export class DeleteDocument {
    static description = "Deletes a document";
    static inputSchema = {
        spaceId: "string",
        documentId: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.deleteDocument(context.spaceId, context.documentId);
            this.return(context.documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}