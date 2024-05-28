export class AgentService {
    constructor() {

    }

    async addCapabilities() {
        await assistOS.callFlow("AddCapabilities");
    }

    async initOpeners() {
        let agent = assistOS.space.getAgent();
        if (agent.openers.length === 0) {
            // await assistOS.callFlow("CreateOpeners", context = {
            //                  capabilities: agent.capabilities,
            //                 openersCount: 3
            //              });
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await assistOS.services.displayThink();
            await delay(2000);
            let openers = ["Welcome to AssistOS! Hello! I'm your personal space Agent, ready to assist you directly from this chat. Whether you need help writing articles, creating chat personalities, translating and proofreading texts, or exploring other applications to enhance our space, I'm here to support you. Additionally, I can create new spaces tailored to your needs. For more options, feel free to visit the Marketplace in the right menu to install any applications you find useful. Let's make the most of your personal space together!"];
            await agent.setOpeners(openers);
            await agent.init();
            assistOS.services.closeThink();
        }
    }

    async analyzeRequest(request, notifyUIFn) {
        //await this.summarizeConversation();
        //let applicationObjects = await assistOS.callFlow("FindObjectsByValue", {});
        let result = await assistOS.agent.callFlow("DeduceIntention", {
            request: request
        });
        await assistOS.agent.addMessage("user", request);
        if (result.flowId) {
            //user wants to execute an operation
            let operationId = result.flowId;
            let response = await assistOS.callFlow("ConfirmParameters", {
                request: request,
                flowId: operationId
            });
            if (response.missingParameters.length !== 0) {
                //request missing parameters from the user
                return await assistOS.callFlow("RequestParameters", {
                    flowId: operationId,
                    missingParameters: response.missingParameters
                });
            } else {
                //execute operation with the current parameters
                let result = await assistOS.callFlow(operationId, response.extractedParameters, agent.id);
                let executionMessageResult = await assistOS.callFlow("ConfirmFlowExecution", {
                    flowId: operationId,
                    parameters: response.extractedParameters,
                    result: result,
                    spaceObjects: applicationObjects
                });
                notifyUIFn();
                return executionMessageResult;
            }
        } else {
            //provide a generic answer
            return await assistOS.callFlow("Fallback",{
                userPrompt: request,
                spaceObjects: applicationObjects
            });
        }
    }

    async summarizeConversation() {
        let agent = assistOS.space.getAgent();
        const limit = 3000;
        if (agent.wordCount > limit) {
            let result = await assistOS.callFlow("SummarizeAgentConversation",{});
            await agent.setContext(result);
        }
    }
    resetConversation() {
        let agent = assistOS.space.getAgent();
        agent.resetConversation();
    }
}