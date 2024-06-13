const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class AddCapabilities extends IFlow {

    static flowParametersSchema = {
        capabilities: {
            type: "array",
            required: true
        }
    };

    static flowMetadata = {
        intent: "AddCapabilities to an agent",
        action: "addCapabilities to an agent",
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let flows = assistOS.space.getAllFlows();
            let agentFlows = flows.filter(flow => flow.inputSchema);

            let operations = agentFlows.map(flow => ({
                description: flow.description,
            }));

            let llm = assistOS.space.getLLM();

            let prompt = `Here is a list of tasks that a custom GPT assistant can perform in a software application: ${JSON.stringify(operations)}. For each of them, summarize their description in a minimum amount of words. Use uppercase for every first letter of a word. Your response should look like this: {"capabilities":["summary 1", "summary 2", ... , "summary n"]}`;
            llm.setResponseFormat("json_object");
            let agent = assistOS.space.getAgent();
            let response = await llm.request(prompt);
            let obj = JSON.parse(response);

            for (let capability of obj.capabilities) {
                await agent.addCapability(capability);
            }
            apis.success(response);
        } catch (e) {
            apis.fail(e);
        }
    }
}

module.exports = AddCapabilities;
