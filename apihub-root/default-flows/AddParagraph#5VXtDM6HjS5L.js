export class AddParagraph {
    static id = "5VXtDM6HjS5L";
    static description = "Adds a new paragraph to a chapter";
    async start(context) {
        try {
            let document = system.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            let newParagraphId = system.services.generateId();
            let position = chapter.paragraphs.length;

            if (system.space.currentParagraphId) {
                position = chapter.getParagraphIndex(system.space.currentParagraphId) + 1;
            }

            await chapter.addParagraph({ id: newParagraphId, text: "" }, position);
            await system.factories.updateDocument(system.space.id, document);

            system.space.currentParagraphId = newParagraphId;
            system.space.currentChapterId = chapter.id;

            this.return(context.chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}