class DeleteParagraph {
    static description = "Deletes a paragraph";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string",
        paragraphId: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.deleteParagraph(context.spaceId, context.documentId, context.chapterId, context.paragraphId);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = DeleteParagraph;