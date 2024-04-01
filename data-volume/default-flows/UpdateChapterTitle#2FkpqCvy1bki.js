export class UpdateChapterTitle {
    static id = "2FkpqCvy1bki";
    static description = "Updates the title of a chapter";
    static inputSchema = {
        documentId: "string",
        chapterId: "string",
        title: "string"
    }
    async start(context){
        try {
            let document = system.space.getDocument(context.documentId);
            let chapter = document.getChapter(context.chapterId);
            chapter.updateTitle(context.title);
            await system.factories.updateDocument(system.space.id, document);
            this.return(context.newTitle);
        } catch (e) {
            this.fail(e);
        }
    }
}