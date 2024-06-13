const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class ChangeSpace extends IFlow {
    static flowMetadata = {
        action: "Changes the current space",
        intent: "Change the current space",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            await assistOS.space.changeSpace(parameters.spaceId);
            apis.success(parameters.spaceId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = ChangeSpace;
