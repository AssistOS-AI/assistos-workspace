export class SwapChapters {
    static id = "4p7y8tRN5FTY";
    static description = "Swaps the order of 2 chapters";

    constructor() {
    }

    async start(documentId, chapterId1, chapterId2) {
        try {
            let document = system.space.getDocument(documentId);

            // Swap chapters in the document
            if (document.swapChapters(chapterId1, chapterId2)) {
                // Update the document after swapping chapters
                await system.factories.updateDocument(system.space.id, document);
                this.return(documentId);
            } else {
                this.fail(`Unable to swap chapters. ${chapterId1}, ${chapterId2}`);
            }
        } catch (e) {
            this.fail(e);
        }
    }
}