const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class DeleteFlow extends IFlow {
    static flowMetadata = {
        action: "Deletes a flow",
        intent: "Delete a flow",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        flowName: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let flowModule = this.loadModule("flow");
            await flowModule.deleteFlow(parameters.spaceId, parameters.flowName);
            apis.success(parameters.flowName);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = DeleteFlow;
