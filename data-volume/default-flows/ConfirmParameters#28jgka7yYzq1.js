export class ConfirmParameters {
    static id = "28jgka7yYzq1";
    static description = "Determines if the request of the user has enough parameters to execute the chosen operation";
    async start(context) {
        let agent = system.space.agent;
        let flow = system.space.getFlow(context.flowId);

        let systemMessage = `Your current task is to extract the necessary parameters from the request and determine which parameters are missing, if any are missing. Here is the operation at hand: ${flow.class.description}. The schema for the parameters is this: ${JSON.stringify(flow.class.inputSchema)}. Using these parameters extract the exact words from the user's request that would fit these parameters values. Check if you can find other parameters in this conversation's history. Your response should be in a JSON format and look like this: {"extractedParameters":{"name": value, "name": value ... "name": value}, "missingParameters": ["name of a missing mandatory parameter", "name of a missing mandatory parameter", ... , "name of a missing mandatory parameter"]}.`;
        this.prompt = context.request;
        await agent.addMessage("system", systemMessage);
        this.setResponseFormat("json_object");
        await this.execute();
    }


    async execute() {
        let agent = system.space.agent;
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        try {
            this.return(JSON.parse(response));
        } catch (e) {
            this.fail(e);
        }

    }
}