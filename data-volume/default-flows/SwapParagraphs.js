export class SwapParagraphs {
    static description = "Swaps the order of 2 paragraphs";
    async start(context) {
        try {
            let document = assistOS.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            // Swap chapters in the document
            if (chapter.swapParagraphs(context.paragraphId1, context.paragraphId2)) {
                await assistOS.storage.swapParagraphs(assistOS.space.id, context.documentId, context.chapterId, context.paragraphId1, context.paragraphId2);
                assistOS.space.currentParagraphId = context.paragraphId1;
            } else {
                this.fail(`Unable to swap paragraphs. ${context.paragraphId1}, ${context.paragraphId2}`);
            }
            this.return(context.paragraphId1);
        } catch (e) {
            this.fail(e);
        }
    }
}