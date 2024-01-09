export class RequestParameters {
    static id = "3GtHfS4MvipX";

    constructor() {
        this.name = "RequestParameters";
        this.description = "Formulates a statement in which the agent requires the user to provide parameters for an operation he wants to execute";
    }

    start(flowId, missingParameters) {
        let flow = webSkel.currentUser.space.getFlow(flowId);
        let parameters = flow.agentConfigs.parameters.filter((parameter) => {
            return missingParameters.includes(parameter.name);
        });

        this.prompt = `You are a custom GPT agent designed for specific tasks in a software application. Your purpose right now is to formulate a statement or a question in which you require the user to provide you with these missing parameters: ${JSON.stringify(parameters)} for this operation: ${flow.agentConfigs.description}.`;

        this.setDefaultValues();
        this.setIntelligenceLevel(3);
        this.execute();
    }

    async execute() {
        let agent = webSkel.currentUser.space.agent;
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        this.return(response);
    }
}