class SwapParagraphs {
    static description = "Swaps the order of 2 paragraphs";
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.swapParagraphs(context.spaceId, context.documentId, context.chapterId, context.paragraphId1, context.paragraphId2);
            this.return(context.paragraphId1);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = SwapParagraphs;