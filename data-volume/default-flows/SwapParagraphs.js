const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class SwapParagraphs extends IFlow {
    static flowMetadata = {
        action: "Swaps the order of 2 paragraphs",
        intent: "Swap paragraphs"
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
        paragraphId1: {
            type: "string",
            required: true
        },
        paragraphId2: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let documentModule = apis.loadModule("document");
            await documentModule.swapParagraphs(parameters.spaceId, parameters.documentId, parameters.chapterId, parameters.paragraphId1, parameters.paragraphId2);
            apis.success(parameters.paragraphId1);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = SwapParagraphs;
