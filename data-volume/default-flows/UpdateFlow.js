const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class UpdateFlow extends IFlow {
    static flowMetadata = {
        action: "Updates a flow",
        intent: "Update flow"
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        flowName: {
            type: "string",
            required: true
        },
        flowData: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let flowModule = apis.loadModule("flow");
            parameters.flowData = "return " + parameters.flowData;
            const classConstructor = new Function(parameters.flowData);
            const flowClass = classConstructor();
            await flowModule.updateFlow(parameters.spaceId, parameters.flowName, flowClass.toString());
            apis.success(parameters.flowName);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = UpdateFlow;
