const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateChapterTitle extends IFlow {
    static flowMetadata = {
        action: "Updates the title of a chapter",
        intent: "Update chapter title"
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
        title: {
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
            await documentModule.updateChapterTitle(parameters.spaceId, parameters.documentId, parameters.chapterId, parameters.title);
            apis.success(parameters.title);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = UpdateChapterTitle;
