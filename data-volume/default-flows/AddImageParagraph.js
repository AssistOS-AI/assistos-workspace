const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddImageParagraph extends IFlow {
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
        paragraphData: {
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
            await documentModule.addParagraph(parameters.spaceId, parameters.documentId, parameters.chapterId, parameters.paragraphData);
            apis.success(parameters.paragraphId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = AddImageParagraph;
