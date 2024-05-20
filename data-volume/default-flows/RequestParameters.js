class RequestParameters {
    static description = "Formulates a statement in which the agent requires the user to provide parameters for an operation he wants to execute";

    constructor() {
    }

    async start(context) {
        let flow = assistOS.space.getFlow(context.flowId);
        let parameters = Object.keys(flow.inputSchema).filter((key) => {
            return context.missingParameters.includes(key);
        });
        let prompt = `Your task right now is to formulate a statement or a question in which you require the user to provide you with these missing parameters: ${JSON.stringify(parameters)} for this operation: ${flow.description}.`;
        let agent = assistOS.space.getAgent();
        let llm = assistOS.space.getLLM();
        let response = await llm.chatbot(prompt, "", agent.getContext());
        this.return(response);
    }
}
module.exports = RequestParameters;