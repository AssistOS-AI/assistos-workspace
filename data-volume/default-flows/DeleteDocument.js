export class DeleteDocument {
    static description = "Deletes a document";
    static inputSchema = {
        documentId: "string"
    }
    async start(context) {
        try {
            await assistOS.space.deleteDocument(context.documentId);
            this.return(context.documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}