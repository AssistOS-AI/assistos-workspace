class AddImageParagraph {
    static description = "Inserts an array of images into a paragraph";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string",
        paragraphId: "string",
        offset: "string",
        paragraphData: "object"
    };
    async start(context) {
        try {
            let documentModule = await this.loadModule("document");
            await documentModule.addParagraph(context.spaceId, context.documentId, context.chapterId, context.paragraphData);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddImageParagraph;