export class UpdateAbstract {
    static description = "Updates the abstract of a document";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        text: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.updateAbstract(context.spaceId, context.documentId, context.text);
            this.return(context.documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}