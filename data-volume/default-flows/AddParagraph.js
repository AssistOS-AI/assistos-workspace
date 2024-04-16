export class AddParagraph {
    static description = "Adds a new paragraph to a chapter";
    static inputSchema = {
        documentId: "string",
        chapterId: "string",
    };
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            let newParagraphId = assistOS.services.generateId();
            let position = chapter.paragraphs.length;

            if (assistOS.space.currentParagraphId) {
                position = chapter.getParagraphIndex(assistOS.space.currentParagraphId) + 1;
            }
            let paragraphObj = {
                text: "",
                position: position
            }
            let paragraph = JSON.parse(await assistOS.storage.addParagraph(assistOS.space.id, document.id, chapter.id, paragraphObj));
            await chapter.addParagraph(paragraph);
            assistOS.space.currentParagraphId = newParagraphId;
            assistOS.space.currentChapterId = chapter.id;
            this.return(context.chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}