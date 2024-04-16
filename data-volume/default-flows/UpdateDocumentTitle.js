export class UpdateDocumentTitle {
    static description = "Updates the title of a document";
    static inputSchema = {
        documentId: "string",
        title: "string"
    }
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            await document.updateTitle(context.title);
            this.return(context.title);
        } catch (e) {
            this.fail(e);
        }
    }
}