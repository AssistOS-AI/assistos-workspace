const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class FindObjectsByValue extends IFlow {
    static flowMetadata = {
        action: "Finds information in the system based on the values provided",
        intent: "Find objects by value",
    };
    static flowParametersSchema = {

    }

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let agent = assistOS.space.getAgent();
            let prompt = `Your task right now is to find objects in the OS that can be identified by IDs, values or names in this conversation history. Here's all the system information available: ${JSON.stringify(await assistOS.space.simplifySpace())}. Put all found objects as they are in an array. Your response should look like this: {"objects": [object 1, object 2, ... ,object n]}. If you didn't find any objects the array should be empty`;
            let llm = assistOS.space.getLLM();
            llm.setResponseFormat("json_object");
            let response = await llm.chatbot(prompt, "", agent.getContext());
            apis.success(JSON.parse(response));
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = FindObjectsByValue;
