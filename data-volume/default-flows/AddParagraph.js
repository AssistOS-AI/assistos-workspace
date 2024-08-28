const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddParagraph extends IFlow {
    static flowMetadata = {
        action: "Adds a new paragraph to a chapter",
        intent: "Add a new paragraph",
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
        position: {
            type: "number",
            required: false
        }
    };

    constructor() {
        super();
    }
    async userCode(apis, parameters) {
        try {
            let documentModule = apis.loadModule("document");
            let paragraphObj = {
                text: parameters.text || "",
                position: parameters.position,
                config: parameters.config || {commands: {}}
            }
            let paragraphId = await documentModule.addParagraph(parameters.spaceId, parameters.documentId, parameters.chapterId, paragraphObj);
            apis.success(paragraphId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = AddParagraph;
