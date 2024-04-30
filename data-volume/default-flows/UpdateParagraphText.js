export class UpdateParagraphText {
    static description = "Updates the text of a paragraph";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string",
        paragraphId: "string",
        text: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.updateParagraphText(context.spaceId, context.documentId, context.paragraphId, context.text);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}