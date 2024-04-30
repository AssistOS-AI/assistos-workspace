export class SwapChapters {
    static description = "Swaps the order of 2 chapters";
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.swapChapters(context.spaceId, context.documentId, context.chapterId1, context.chapterId2);
            this.return("");
        } catch (e) {
            this.fail(e);
        }
    }
}