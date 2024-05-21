class AddChapter {
    static description = "Adds a new chapter to a document";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
    }
    async start(context) {
        if (!context.title) {
            context.title = "NewChapter";
        }

        try {
            let documentModule = this.loadModule("document");
            let chapterData = {title: context.title, paragraphs:[{text: ""}]};
            chapterData.position = context.position;
            let chapterId = await documentModule.addChapter(context.spaceId, context.documentId, chapterData);
            this.return(chapterId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddChapter;