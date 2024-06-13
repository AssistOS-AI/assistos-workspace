const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddFlow extends IFlow {
    static flowMetadata = {
        action: "Adds a new flow to be used to execute an operation in the application",
        intent: "User wants to add a new flow",
    };

    static flowParametersSchema = {
        name: {
            required: true,
            type: "string"
        },
        action: {
            required: true,
            type: "string"
        },
        intent: {
            required: true,
            type: "string"
        },
        code: {
            required: true,
            type: "string"
        },
        flowParametersSchema: {
            required: true,
            type: "object"
        }
    };

    constructor() {
        super(AddFlow);
    }

    async userCode(apis, parameters) {
        const flowModule = await apis.loadModule("flow");
        const flowData ={
            name: parameters.name,
            action: parameters.action,
            intent: parameters.intent,
            code: parameters.code,
            flowParametersSchema: parameters.flowParametersSchema
        };
        await flowModule.addFlow(assistOS.space.id,flowData);
        apis.success("Flow added successfully");
    }
}

module.exports = AddFlow;
