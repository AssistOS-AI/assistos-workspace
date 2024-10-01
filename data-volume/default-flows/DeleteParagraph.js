const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeleteParagraph extends IFlow {
    static flowMetadata = {
        action: "Deletes a paragraph",
        intent: "Delete a paragraph",
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
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            const documentModule = this.loadModule("document");
            await documentModule.deleteParagraph(parameters.spaceId, parameters.documentId, parameters.chapterId, parameters.paragraphId);
            apis.success(parameters.paragraphId);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = DeleteParagraph;
