export class UpdateChapterTitle {
    static description = "Updates the title of a chapter";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string",
        title: "string"
    }
    async start(context){
        try {
            let documentModule = this.loadModule("document");
            await documentModule.updateChapterTitle(context.spaceId, context.documentId, context.chapterId, context.title);
            this.return(context.newTitle);
        } catch (e) {
            this.fail(e);
        }
    }
}