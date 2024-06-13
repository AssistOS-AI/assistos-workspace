const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeleteDocument extends IFlow {
    static flowMetadata = {
        action: "Deletes a document",
        intent: "Delete a document",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        documentId: {
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
            await documentModule.deleteDocument(parameters.spaceId, parameters.documentId);
            apis.success(parameters.documentId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = DeleteDocument;
