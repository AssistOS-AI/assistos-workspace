export class AgentService {
    constructor() {

    }
    async initOpeners(){
        let agent = webSkel.currentUser.space.agent;
        if(agent.openers.length === 0){
            let flowId = webSkel.currentUser.space.getFlowIdByName("CreateOpeners");
            await webSkel.getService("LlmsService").callFlow(flowId, agent.capabilities, 3);
        }
    }
    async analyzeRequest(request){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeduceIntention");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, request);
        if(result.responseJson.operation){
            //user wants to execute an operation
            let flowId = webSkel.currentUser.space.getFlowIdByName("ConfirmParameters");
            let operationId = result.responseJson.operationId;
            let response = await webSkel.getService("LlmsService").callFlow(flowId, request, operationId);
            if(response.responseJson.missingParameters.length !== 0){
                //request missing parameters from the user
                let flowId = webSkel.currentUser.space.getFlowIdByName("RequestParameters");
                return await webSkel.getService("LlmsService").callFlow(flowId, operationId, response.responseJson.missingParameters);
            }else {
                //execute operation with the current parameters
                let parameters = response.responseJson.extractedParameters.map((flow) => flow.value);
                return await webSkel.getService("LlmsService").callFlow(operationId, ...parameters);
            }
        }else {
            //provide a generic answer
            let flowId = webSkel.currentUser.space.getFlowIdByName("DefaultAgent");
            return await webSkel.getService("LlmsService").callFlow(flowId, request, agent.loadKnowledge());
        }
    }
}