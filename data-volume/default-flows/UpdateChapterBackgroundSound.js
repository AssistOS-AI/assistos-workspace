const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateChapterBackgroundSound extends IFlow {
    static flowMetadata = {
        action: "Adds a new announcement to the current space",
        intent: "User wants to add an announcement",
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
        chapterId:{
            type: "string",
            required: true
        },
        backgroundSound: {
            type: "object",
            required: false
        }
    };

    constructor() {
        super(UpdateChapterBackgroundSound);
    }

    async userCode(apis, parameters) {
        let documentModule = apis.loadModule("document");
        await documentModule.updateChapterBackgroundSound(assistOS.space.id, parameters.documentId, parameters.chapterId, parameters.backgroundSound);
        apis.success(parameters.chapterId);
    }
}

module.exports = UpdateChapterBackgroundSound;
