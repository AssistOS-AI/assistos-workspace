export class DeleteParagraph {
    static id = "2Ds4XYzD8Pu1";
    static description = "Deletes a paragraph";
    static inputSchema = {
        documentId: "string",
        chapterId: "string",
        paragraphId: "string"
    }
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            chapter.deleteParagraph(context.paragraphId);
            await assistOS.storage.deleteParagraph(assistOS.space.id, context.documentId, context.chapterId, context.paragraphId);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}