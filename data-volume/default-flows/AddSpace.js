const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddSpace extends IFlow {
    static flowMetadata = {
        action: "Adds a new workspace",
        intent: "Add a new workspace",
    };

    static flowParametersSchema = {
        name: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            const spaceModule = apis.loadModule('space');
            apis.success(await spaceModule.createSpace(parameters.name));
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = AddSpace;
