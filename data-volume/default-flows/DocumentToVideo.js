const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DocumentToVideo extends IFlow {
    static flowMetadata = {
        action: "creates a video from a document",
        intent: "User wants to create a video from a document",
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
        super(DocumentToVideo);
    }

    async userCode(apis, parameters) {
        let documentModule = apis.loadModule("document");
        let videoId = await documentModule.documentToVideo(parameters.spaceId, parameters.documentId);
        apis.success(videoId);
    }
}

module.exports = DocumentToVideo;