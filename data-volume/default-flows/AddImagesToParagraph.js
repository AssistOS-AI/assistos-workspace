class AddImagesToParagraph {
    static description = "Inserts an array of images into a paragraph";
    static inputSchema = {
        spaceId: "string",
        documentId: "string",
        chapterId: "string",
        paragraphId: "string",
        offset: "string",
        imagesData: "object"
    };
    async start(context) {
        try {
            let documentModule = await this.loadModule("document");
            let paragraph = await documentModule.getParagraph(context.spaceId, context.documentId, context.paragraphId);
            let imagesIdsString = ` `;
            for(let image of context.imagesData.images) {
                imagesIdsString += `{&quot;imageId&quot;:&quot;${image.id}&quot;,&quot;galleryId&quot;:&quot;${context.imagesData.galleryId}&quot;} `;
            }
            paragraph.text = paragraph.text.slice(0, context.offset) + imagesIdsString + paragraph.text.slice(context.offset);
            await documentModule.updateParagraphText(context.spaceId, context.documentId, context.paragraphId, paragraph.text);
            this.return(context.paragraphId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddImagesToParagraph;