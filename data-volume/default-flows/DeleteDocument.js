export class DeleteDocument {
    static description = "Deletes a document";
    static inputSchema = {
        documentId: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            let userModule = this.loadModule("user");
            let spaceId = userModule.getCurrentSpaceId();
            await documentModule.deleteDocument(spaceId, context.documentId);
            this.return(context.documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}