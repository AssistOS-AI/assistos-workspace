const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class RequestParameters extends IFlow {
    static flowMetadata = {
        action: "Formulates a statement requiring the user to provide parameters for an operation",
        intent: "Request parameters"
    };

    static flowParametersSchema = {
        flowId: {
            type: "string",
            required: true
        },
        missingParameters: {
            type: "array",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let flow = assistOS.space.getFlow(parameters.flowId);
            let requiredParameters = Object.keys(flow.inputSchema).filter((key) => {
                return parameters.missingParameters.includes(key);
            });
            let prompt = `Your task right now is to formulate a statement or a question in which you require the user to provide you with these missing parameters: ${JSON.stringify(requiredParameters)} for this operation: ${flow.description}.`;
            let agent = assistOS.space.getAgent();
            let llm = assistOS.space.getLLM();
            let response = await llm.chatbot(prompt, "", agent.getContext());
            apis.success(response);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = RequestParameters;
