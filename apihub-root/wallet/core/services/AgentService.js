export class AgentService {
    constructor() {

    }
    async addCapabilities(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddCapabilities");
        await webSkel.appServices.callFlow(flowId);
    }
    async initOpeners(){
        let agent = webSkel.currentUser.space.agent;
        if(agent.openers.length === 0){
            //let flowId = webSkel.currentUser.space.getFlowIdByName("CreateOpeners");
            //await webSkel.appServices.callFlow(flowId, agent.capabilities, 3);
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await webSkel.appServices.displayThink();
            await delay(2000);
            let openers = ["Welcome to AssistOS! Hello! I'm your personal space Agent, ready to assist you directly from this chat. Whether you need help writing articles, creating chat personalities, translating and proofreading texts, or exploring other applications to enhance our space, I'm here to support you. Additionally, I can create new spaces tailored to your needs. For more options, feel free to visit the Marketplace in the right menu to install any applications you find useful. Let's make the most of your personal space together!"];
            await webSkel.currentUser.space.agent.setOpeners(openers);
            webSkel.appServices.closeThink();
        }
    }
    async analyzeRequest(request){
        await this.summarizeConversation();
        let flowId1 = webSkel.currentUser.space.getFlowIdByName("FindObjectsByValue");
        let applicationObjects = await webSkel.appServices.callFlow(flowId1, request);

        let agent = webSkel.currentUser.space.agent;
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeduceIntention");
        let result = await webSkel.appServices.callFlow(flowId, request);
        await agent.addMessage("user", request);
        if(result.responseJson.flowId){
            //user wants to execute an operation
            let flowId2 = webSkel.currentUser.space.getFlowIdByName("ConfirmParameters");
            let operationId = result.responseJson.flowId;
            let response = await webSkel.appServices.callFlow(flowId2, request, operationId);
            if(response.responseJson.missingParameters.length !== 0){
                //request missing parameters from the user
                let flowId = webSkel.currentUser.space.getFlowIdByName("RequestParameters");
                return await webSkel.appServices.callFlow(flowId, operationId, response.responseJson.missingParameters);
            }else {
                //execute operation with the current parameters
                let flow = webSkel.currentUser.space.getFlow(operationId);
                let order = flow.class.parameters.map((parameter) => parameter.name);
                response.responseJson.extractedParameters.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
                let parameters = response.responseJson.extractedParameters.map((parameter) => parameter.value);
                let result = await webSkel.appServices.callFlow(operationId, ...parameters);
                let res;
                if(result.responseJson){
                    res = JSON.stringify(result.responseJson);
                }else {
                    res = result.responseString;
                }
                let flowId = webSkel.currentUser.space.getFlowIdByName("ConfirmFlowExecution");
                return await webSkel.appServices.callFlow(flowId, operationId, response.responseJson.extractedParameters, res, applicationObjects.responseJson);

            }
        }else {
            //provide a generic answer
            let flowId = webSkel.currentUser.space.getFlowIdByName("Fallback");
            return await webSkel.appServices.callFlow(flowId, request, applicationObjects.responseJson);
        }
    }

    async summarizeConversation(){
        let agent = webSkel.currentUser.space.agent;
        const limit = 3000;
        if(agent.wordCount > limit){
            let flowId = webSkel.currentUser.space.getFlowIdByName("SummarizeAgentConversation");
            let result = await webSkel.appServices.callFlow(flowId);
            await agent.setContext(result.responseString);
        }
    }
}