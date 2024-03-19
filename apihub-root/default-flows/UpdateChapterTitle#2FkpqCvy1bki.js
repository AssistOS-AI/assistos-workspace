export class UpdateChapterTitle {
    static id = "2FkpqCvy1bki";
    static description = "Updates the title of a chapter";
    constructor() {
    }

    async start(documentId, chapterId, newTitle) {
        try {
            let document = system.space.getDocument(documentId);
            let chapter = document.getChapter(chapterId);
            chapter.updateTitle(newTitle);
            await system.factories.updateDocument(system.space.id, document);
            this.return(newTitle);
        } catch (e) {
            this.fail(e);
        }
    }
}