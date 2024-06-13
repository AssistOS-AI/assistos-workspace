const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddPersonality extends IFlow {
    static flowMetadata = {
        action: "Adds a new personality",
        intent: "Add a new personality",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        name: {
            type: "string",
            required: true
        },
        description: {
            type: "string",
            required: true
        },
        photo: {
            type: "string",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let personalityModule = apis.loadModule("personality");
            let personalityData = {
                name: parameters.name,
                description: parameters.description,
                image: parameters.photo,
                metadata: ["name", "id", "photo"]
            };
            await personalityModule.addPersonality(parameters.spaceId, personalityData);
            apis.success(personalityData);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = AddPersonality;
