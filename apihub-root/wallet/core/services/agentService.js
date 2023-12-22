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
                let order = flow.agentConfigs.parameters.map((parameter) => parameter.name);
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

    a(){
        let a = ({
            start: async function(flowId, request){
                let agent = webSkel.currentUser.space.agent;
                let context = `You are a custom GPT agent designed for specific tasks in a software application. Your task right now is to find objects in the system that can be identified by some unique information that the user gives you. Ignore other requests from the user. These objects can later be used as parameters for certain operations in the application. Keep in mind that strings and integers can be considered objects. Here's all the system information available: ${JSON.stringify(webSkel.currentUser.space)}. Put all found objects as they are in an array. Your response should look like this: {"objects": [object 1, object 2, ... ,object n]}`;
                await agent.addMessage("system", context);
                this.prompt = request;
                this.setDefaultValues();
                this.setResponseFormat("json_object")
                this.setIntelligenceLevel(3);
                this.execute(agent);
            },
            execute: async function(agent){
                let response = await this.chatbot(this.prompt, "", agent.getContext());
                try {
                    JSON.parse(response);
                }catch (e){
                    this.fail(e)
                }
                this.return(response);
            }
        })
    }
}