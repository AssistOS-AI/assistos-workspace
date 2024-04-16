export class DeleteChapter {
    static description = "Deletes a chapter";
    static inputSchema = {
        documentId: "string",
        chapterId: "string"
    }
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            await document.deleteChapter(context.chapterId);
            this.return(context.chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}