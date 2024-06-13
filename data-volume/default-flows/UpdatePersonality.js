const IFlow = require('assistos').loadModule('flow', {}).IFlow;
class UpdatePersonality extends IFlow {
    static flowMetadata = {
        action: "Updates information about a personality",
        intent: "Update personality information"
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        personalityId: {
            type: "string",
            required: true
        },
        personalityData: {
            type: "object",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let personalityModule = apis.loadModule("personality");
            await personalityModule.updatePersonality(parameters.spaceId, parameters.personalityId, parameters.personalityData);
            apis.success(parameters.personalityId);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = UpdatePersonality;
