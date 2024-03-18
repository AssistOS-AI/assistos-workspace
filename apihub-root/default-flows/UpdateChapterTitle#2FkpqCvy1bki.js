export class UpdateChapterTitle {
    static id = "2FkpqCvy1bki";
    static description = "Updates the title of a chapter";
    constructor() {
    }

    async start(documentId, chapterId, newTitle) {
        try {
            let document = webSkel.currentUser.space.getDocument(documentId);
            let chapter = document.getChapter(chapterId);
            chapter.updateTitle(newTitle);
            await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            this.return(newTitle);
        } catch (e) {
            this.fail(e);
        }
    }
}