const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeletePersonality extends IFlow {
    static flowMetadata = {
        action: "Deletes a personality",
        intent: "Delete a personality",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        personalityId: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let personalityModule = this.loadModule("personality");
            await personalityModule.deletePersonality(parameters.spaceId, parameters.personalityId);
            apis.success(parameters.personalityId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = DeletePersonality;
