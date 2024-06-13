const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateAbstract extends IFlow {
    static flowMetadata = {
        action: "Updates the abstract of a document",
        intent: "Update document abstract"
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
        text: {
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
            await documentModule.updateDocumentAbstract(parameters.spaceId, parameters.documentId, parameters.text);
            apis.success(parameters.documentId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = UpdateAbstract;
