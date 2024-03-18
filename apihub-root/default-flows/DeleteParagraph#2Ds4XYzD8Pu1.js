export class DeleteParagraph {
    static id = "2Ds4XYzD8Pu1";
    static description = "Deletes a paragraph";

    constructor() {
    }

    async start(documentId, chapterId, paragraphId) {
        try {
            let document = webSkel.currentUser.space.getDocument(documentId);
            let chapter = document.getChapter(chapterId);
            chapter.deleteParagraph(paragraphId);
            await documentFactory.updateDocument(webSkel.currentUser.space.id, document);
            this.return(paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}