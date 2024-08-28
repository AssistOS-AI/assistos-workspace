const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddChapter extends IFlow {
    static flowMetadata = {
        action: "Chapter",
        intent: "Add"
    };

    static flowParametersSchema = {
        title: {
            type: "string",
            required: false
        },
        position: {
            type: "number",
            required: false
        },
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
        if (!parameters.title) {
            parameters.title = "NewChapter";
        }
        try {
            let documentModule = apis.loadModule("document");
            let chapterData = {title: parameters.title, paragraphs: [{text: "", position: 0, config: {commands: {}}}]};
            chapterData.position = parameters.position;
            let chapterId = await documentModule.addChapter(parameters.spaceId, parameters.documentId, chapterData);
            apis.success(chapterId);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = AddChapter;
