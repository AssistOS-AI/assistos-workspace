const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateParagraphText extends IFlow {
    static flowMetadata = {
        action: "Updates the text of a paragraph",
        intent: "Update paragraph text"
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
        paragraphId: {
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
            await documentModule.updateParagraphText(parameters.spaceId, parameters.documentId, parameters.paragraphId, parameters.text);
            apis.success(parameters.paragraphId);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = UpdateParagraphText;
