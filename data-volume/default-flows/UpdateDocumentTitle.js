const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateDocumentTitle extends IFlow {
    static flowMetadata = {
        action: "Updates the title of a document",
        intent: "Update document title"
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
            await documentModule.updateDocumentTitle(parameters.spaceId, parameters.documentId, parameters.title);
            apis.success(parameters.title);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = UpdateDocumentTitle;
