export class AgentService {
    constructor() {

    }

    async addCapabilities() {
        let flowId = system.space.getFlowIdByName("AddCapabilities");
        await system.services.callFlow(flowId);
    }

    async initOpeners() {
        let agent = system.space.agent;
        if (agent.openers.length === 0) {
            //let flowId = system.space.getFlowIdByName("CreateOpeners");
            // let context = {
            //     capabilities: agent.capabilities,
            //     openersCount: 3
            // }
            // await system.services.callFlow(flowId, context);
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await system.services.displayThink();
            await delay(2000);
            let openers = ["Welcome to AssistOS! Hello! I'm your personal space Agent, ready to assist you directly from this chat. Whether you need help writing articles, creating chat personalities, translating and proofreading texts, or exploring other applications to enhance our space, I'm here to support you. Additionally, I can create new spaces tailored to your needs. For more options, feel free to visit the Marketplace in the right menu to install any applications you find useful. Let's make the most of your personal space together!"];
            await system.space.agent.setOpeners(openers);
            system.services.closeThink();
        }
    }

    async analyzeRequest(request) {
        await this.summarizeConversation();
        let flowId1 = system.space.getFlowIdByName("FindObjectsByValue");
        let applicationObjects = await system.services.callFlow(flowId1, {});

        let agent = system.space.agent;
        let flowId = system.space.getFlowIdByName("DeduceIntention");
        let context = {
            request: request
        }
        let result = await system.services.callFlow(flowId, context);
        await agent.addMessage("user", request);
        if (result.flowId) {
            //user wants to execute an operation
            let flowId2 = system.space.getFlowIdByName("ConfirmParameters");
            let operationId = result.flowId;
            let context = {
                request: request,
                flowId: operationId
            }
            let response = await system.services.callFlow(flowId2, context);
            if (response.missingParameters.length !== 0) {
                //request missing parameters from the user
                let flowId = system.space.getFlowIdByName("RequestParameters");
                let context = {
                    flowId: operationId,
                    missingParameters: response.missingParameters
                }
                return await system.services.callFlow(flowId, context);
            } else {
                //execute operation with the current parameters
                let result = await system.services.callFlow(operationId, response.extractedParameters);
                let flowId = system.space.getFlowIdByName("ConfirmFlowExecution");
                let context = {
                    flowId: operationId,
                    parameters: response.extractedParameters,
                    result: result,
                    spaceObjects: applicationObjects
                }
                let executionMessageResult = await system.services.callFlow(flowId, context);
                return {refreshRightPanel: true, message: executionMessageResult};
            }
        } else {
            //provide a generic answer
            let flowId = system.space.getFlowIdByName("Fallback");
            let context = {
                userPrompt: request,
                spaceObjects: applicationObjects
            }
            return await system.services.callFlow(flowId, context);
        }
    }

    async summarizeConversation() {
        let agent = system.space.agent;
        const limit = 3000;
        if (agent.wordCount > limit) {
            let flowId = system.space.getFlowIdByName("SummarizeAgentConversation");
            let result = await system.services.callFlow(flowId);
            await agent.setContext(result);
        }
    }
    resetConversation() {
        let agent = system.space.agent;
        agent.resetConversation();
        let agentDefaultInstructions = "You are an agent that oversees an operating system called AssistOS. This OS has some applications installed on it. Each application has different pages and objects related to them. The bare OS also has some pages and objects related to it. You are aware of objects that are created within the OS and can perform certain operations with them or create new objects.";
        agent.addMessage("system", agentDefaultInstructions);
    }
}