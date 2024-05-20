class DeleteChapter {
    static description = "Deletes a chapter";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string"
    }
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.deleteChapter(context.spaceId, context.documentId, context.chapterId);
            this.return(context.chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = DeleteChapter;