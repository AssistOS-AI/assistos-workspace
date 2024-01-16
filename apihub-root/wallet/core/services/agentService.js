export class AgentService {
    constructor() {

    }
    async addCapabilities(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddCapabilities");
        await webSkel.getService("LlmsService").callFlow(flowId);
    }
    async initOpeners(){
        let agent = webSkel.currentUser.space.agent;
        if(agent.openers.length === 0){
            let flowId = webSkel.currentUser.space.getFlowIdByName("CreateOpeners");
            await webSkel.getService("LlmsService").callFlow(flowId, agent.capabilities, 3);
        }
    }
    async analyzeRequest(request){
        await this.summarizeConversation();
        let flowId1 = webSkel.currentUser.space.getFlowIdByName("FindObjectsByValue");
        let response1 = await webSkel.getService("LlmsService").callFlow(flowId1, request);

        let agent = webSkel.currentUser.space.agent;
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeduceIntention");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, request);
        await agent.addMessage("user", request);
        if(result.responseString){
            //user wants to execute an operation
            let flowId2 = webSkel.currentUser.space.getFlowIdByName("ConfirmParameters");
            let operationId = result.responseString;
            let response = await webSkel.getService("LlmsService").callFlow(flowId2, request, operationId, response1.responseJson);
            if(response.responseJson.missingParameters.length !== 0){
                //request missing parameters from the user
                let flowId = webSkel.currentUser.space.getFlowIdByName("RequestParameters");
                return await webSkel.getService("LlmsService").callFlow(flowId, operationId, response.responseJson.missingParameters);
            }else {
                //execute operation with the current parameters
                let flow = webSkel.currentUser.space.getFlow(operationId);
                let order = flow.class.parameters.map((parameter) => parameter.name);
                response.responseJson.extractedParameters.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
                let parameters = response.responseJson.extractedParameters.map((parameter) => parameter.value);
                let result = await webSkel.getService("LlmsService").callFlow(operationId, ...parameters);
                let res;
                if(result.responseJson){
                    res = JSON.stringify(result.responseJson);
                }else {
                    res = result.responseString
                }
                let flowId = webSkel.currentUser.space.getFlowIdByName("ConfirmFlowExecution");
                return await webSkel.getService("LlmsService").callFlow(flowId, operationId, response.responseJson.extractedParameters, res);

            }
        }else {
            //provide a generic answer
            let flowId = webSkel.currentUser.space.getFlowIdByName("Fallback");
            return await webSkel.getService("LlmsService").callFlow(flowId, request);
        }
    }

    async summarizeConversation(){
        let agent = webSkel.currentUser.space.agent;
        const limit = 3000;
        if(agent.wordCount > limit){
            let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeAgentConversation");
            let result = await webSkel.getService("LlmsService").callFlow(flowId);
            await agent.setContext(result.responseString);
        }
    }
}