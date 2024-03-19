export class DeleteChapter {
    static id = "2BDPLeWZ2cuQ";
    static description = "Deletes a chapter";
    constructor() {
    }

    async start(documentId, chapterId) {
        try {
            let document = system.space.getDocument(documentId);
            await document.deleteChapter(chapterId);
            this.return(chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}