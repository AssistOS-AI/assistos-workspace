const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddImagesToParagraph extends IFlow {
    static flowMetadata = {
        action: "Inserts an array of images into a paragraph",
        intent: "Add images to a paragraph",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        documentId: {
            type: "string",
            required: true
        },
        chapterId: {
            type: "string",
            required: true
        },
        paragraphId: {
            type: "string",
            required: true
        },
        offset: {
            type: "string",
            required: true
        },
        imagesData: {
            type: "object",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let documentModule = apis.loadModule("document");
            let paragraph = await documentModule.getParagraph(parameters.spaceId, parameters.documentId, parameters.paragraphId);
            let imagesIdsString = ` `;
            for (let image of parameters.imagesData.images) {
                imagesIdsString += `{&quot;imageId&quot;:&quot;${image.id}&quot;,&quot;galleryId&quot;:&quot;${parameters.imagesData.galleryId}&quot;} `;
            }
            paragraph.text = paragraph.text.slice(0, parameters.offset) + imagesIdsString + paragraph.text.slice(parameters.offset);
            await documentModule.updateParagraphText(parameters.spaceId, parameters.documentId, parameters.paragraphId, paragraph.text);
            apis.success(parameters.paragraphId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = AddImagesToParagraph;
