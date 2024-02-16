export class ConfirmParameters {
    static id = "28jgka7yYzq1";
    static description = "Determines if the request of the user has enough parameters to execute the chosen operation";

    constructor() {
    }

    async start(request, flowId) {
        let agent = webSkel.currentUser.space.agent;
        let flow = webSkel.currentUser.space.getFlow(flowId);
        let paramsName = flow.class.parameters.map((parameter) => parameter.name);

        let context = `Your current task is to extract the necessary parameters from the request and determine which parameters are missing, if any are missing. Here is the operation at hand: ${flow.class.description}. The necessary parameters are presented here: ${JSON.stringify(flow.class.parameters)}. Using these characteristics of these parameters extract the exact words from the user's request that would fit these parameters values. Check if you can find other parameters in this conversation's history. Some parameters are optional, if you found no match for those parameters treat their value as an empty string. Your response should be in a JSON format and look like this: {"extractedParameters":[${this.iterateParameters(paramsName)}], "missingParameters": ["name of a missing mandatory parameter", "name of a missing mandatory parameter", ... , "name of a missing mandatory parameter"]}.`;
        this.prompt = request;
        await agent.addMessage("system", context);
        this.setDefaultValues();
        this.setResponseFormat("json_object");
        this.setIntelligenceLevel(3);
        await this.execute();
    }

    iterateParameters(params) {
        let string = "";
        for (let i = 0; i < params.length; i++) {
            string += `{"name":"${params[i]}", "value":"extracted value from the user's request"}`;
            if (i < params.length - 1) {
                string += ', ';
            }
        }
        return string;
    }

    async execute() {
        let agent = webSkel.currentUser.space.agent;
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        try {
            JSON.parse(response);
        } catch (e) {
            this.fail(e);
        }
        this.return(response);
    }
}