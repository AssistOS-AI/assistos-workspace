export class AgentService {
    constructor() {

    }

    async addCapabilities() {
        let flowId = system.space.getFlowIdByName("AddCapabilities");
        await system.services.callFlow(flowId);
    }

    async initOpeners() {
        let agent = system.space.getAgent();
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
            await agent.setOpeners(openers);
            await agent.init();
            system.services.closeThink();
        }
    }

    async analyzeRequest(request, notifyUIFn) {
        //await this.summarizeConversation();
        let flowId1 = system.space.getFlowIdByName("FindObjectsByValue");
        let applicationObjects = await system.services.callFlow(flowId1, {});

        let agent = system.space.getAgent();
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
                notifyUIFn();
                return executionMessageResult;
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
        let agent = system.space.getAgent();
        const limit = 3000;
        if (agent.wordCount > limit) {
            let flowId = system.space.getFlowIdByName("SummarizeAgentConversation");
            let result = await system.services.callFlow(flowId);
            await agent.setContext(result);
        }
    }
    resetConversation() {
        let agent = system.space.getAgent();
        agent.resetConversation();
    }

    async analyzeRequestIndependentAgent(request, notifyUIFn) {
        let flowId1 = system.space.getFlowIdByName("FindObjectsByValue");
        let applicationObjects = await system.services.callFlow(flowId1, {});

        let agent = system.space.getAgent();
        let flowId = system.space.getFlowIdByName("InstructAgent");
        let context = {
            request: request
        }
        let result = await system.services.callFlow(flowId, context);
        await agent.addMessage("user", request);
        if(result.flowIds){
            agent.setCurrentTask(result.flowIds);
            let confirmParametersFlowId = system.space.getFlowIdByName("ConfirmParameters");
            let missingParameters = [];
            for(let flow of agent.flowsArray){
                if(flow.executed){
                    continue;
                }
                let context = {
                    request: request,
                    flowId: flow.flowId,
                }
                let response = await system.services.callFlow(confirmParametersFlowId, context);
                if (response.missingParameters.length !== 0) {
                    missingParameters.push({flowId: flow.flowId, missingParameters:response.missingParameters});
                } else {
                    let result = await system.services.callFlow(flow.flowId, response.extractedParameters);
                    flow.executed = true;
                    let flowId = system.space.getFlowIdByName("ConfirmFlowExecution");
                    let context = {
                        flowId: flow.flowId,
                        parameters: response.extractedParameters,
                        result: result,
                        spaceObjects: applicationObjects
                    }
                    let executionMessageResult = await system.services.callFlow(flowId, context);
                    let executionMessage = `You have succesfully executed the operation with id: ${flow.flowId} and the result is: ${executionMessageResult}`
                    agent.addMessage("system", executionMessage);
                    notifyUIFn();
                }
            }
            if(missingParameters.length !== 0){
                //request missing parameters from the user
                let flowId = system.space.getFlowIdByName("RequestMultipleParameters");
                let context = {
                    missingParameters: missingParameters
                }
                return await system.services.callFlow(flowId, context);
            } else {
                let flowId = system.space.getFlowIdByName("ConfirmTaskCompletion");
                agent.deleteTask();
                return await system.services.callFlow(flowId, {});
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
}