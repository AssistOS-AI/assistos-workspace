const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class SwapChapters extends IFlow {
    static flowMetadata = {
        action: "Swaps the order of 2 chapters",
        intent: "Swap chapters"
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
        chapterId1: {
            type: "string",
            required: true
        },
        chapterId2: {
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
            await documentModule.swapChapters(parameters.spaceId, parameters.documentId, parameters.chapterId1, parameters.chapterId2);
            apis.success("");
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = SwapChapters;
