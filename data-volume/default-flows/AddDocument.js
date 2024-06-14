const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddDocument extends IFlow {
    static flowMetadata = {
        action: "Adds a new document, article or any kind of paperwork",
        intent: "User wants to add a new document",
    };

    static flowParametersSchema = {
        topic: {
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
            let docData = {
                title: parameters.title,
                topic: parameters.topic,
            };
            let documentModule = apis.loadModule("document");
            let docId = await documentModule.addDocument(assistOS.space.id, docData);
            apis.success(docId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = AddDocument;
