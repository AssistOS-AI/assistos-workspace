const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeleteChapter extends IFlow {
    static flowMetadata = {
        action: "Deletes a chapter",
        intent: "Delete a chapter",
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
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let documentModule = this.loadModule("document");
            await documentModule.deleteChapter(parameters.spaceId, parameters.documentId, parameters.chapterId);
            apis.success(parameters.chapterId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = DeleteChapter;
