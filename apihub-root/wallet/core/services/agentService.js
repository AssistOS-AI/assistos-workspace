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
        let agent = webSkel.currentUser.space.agent;
        let agentFlows = webSkel.currentUser.space.flows.filter((flow)=>{flow.tags.includes("agents")});
        let operations = agentFlows.map((flow)=>{
            return {id:flow.id,description:flow.description}
            });
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeduceIntention");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, operations, request, agent.loadKnowledge());
        if(result.responseJson.operation === "operation"){
            return result;
            // let flowId = webSkel.currentUser.space.getFlowIdByName("ConfirmParameters");
            // return await webSkel.getService("LlmsService").callFlow(flowId, request, result.responseJson.operationId);
        }else {
            return result;
        }
    }
}