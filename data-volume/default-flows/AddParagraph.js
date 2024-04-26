export class AddParagraph {
    static description = "Adds a new paragraph to a chapter";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string",
    };
    async start(context) {
        try {
            let documentModule = this.loadModule("document");
            let paragraphObj = {
                text: "",
                position: context.position
            }
            let paragraphId = await documentModule.addParagraph(context.spaceId, context.documentId, context.chapterId, paragraphObj);
            this.return(paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}