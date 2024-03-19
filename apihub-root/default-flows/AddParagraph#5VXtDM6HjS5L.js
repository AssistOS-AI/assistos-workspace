export class AddParagraph {
    static id = "5VXtDM6HjS5L";
    static description = "Adds a new paragraph to a chapter";
    constructor() {
    }

    async start(documentId, chapterId) {
        try {
            let document = system.space.getDocument(documentId);
            let chapter = document.getChapter(chapterId);
            let newParagraphId = system.services.generateId();
            let position = chapter.paragraphs.length;

            if (system.space.currentParagraphId) {
                position = chapter.getParagraphIndex(system.space.currentParagraphId) + 1;
            }

            await chapter.addParagraph({ id: newParagraphId, text: "" }, position);
            await system.factories.updateDocument(system.space.id, document);

            system.space.currentParagraphId = newParagraphId;
            system.space.currentChapterId = chapter.id;

            this.return(chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}