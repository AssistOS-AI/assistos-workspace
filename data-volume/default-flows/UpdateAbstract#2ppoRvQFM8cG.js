export class UpdateAbstract {
    static id = "2ppoRvQFM8cG";
    static description = "Updates the abstract of a document";
    static inputSchema = {
        documentId: "string",
        text: "string"
    }
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            await document.updateAbstract(context.text);
            this.return(context.documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}