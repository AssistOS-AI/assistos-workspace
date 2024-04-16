export class UpdateParagraphText {
    static description = "Updates the text of a paragraph";
    static inputSchema = {
        documentId: "string",
        chapterId: "string",
        paragraphId: "string",
        text: "string"
    }
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            let paragraph = chapter.getParagraph(context.paragraphId);
            paragraph.updateText(context.text);
            await assistOS.storage.updateParagraphText(assistOS.space.id, document.id, chapter.id, paragraph.id, context.text);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}