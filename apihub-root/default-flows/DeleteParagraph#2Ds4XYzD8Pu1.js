export class DeleteParagraph {
    static id = "2Ds4XYzD8Pu1";
    static description = "Deletes a paragraph";
    async start(context) {
        try {
            let document = system.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            chapter.deleteParagraph(context.paragraphId);
            await system.factories.updateDocument(system.space.id, document);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}