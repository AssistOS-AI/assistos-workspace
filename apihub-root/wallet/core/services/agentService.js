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
}