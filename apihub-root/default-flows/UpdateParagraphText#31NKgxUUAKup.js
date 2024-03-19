export class UpdateParagraphText {
    static id = "31NKgxUUAKup";
    static description = "Updates the text of a paragraph";

    constructor() {
    }

    async start(documentId, chapterId, paragraphId, text) {
        try {
            let document = system.space.getDocument(documentId);
            let chapter = document.getChapter(chapterId);
            let paragraph = chapter.getParagraph(paragraphId);
            paragraph.updateText(text);
            await system.factories.updateDocument(system.space.id, document);
            this.return(paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}