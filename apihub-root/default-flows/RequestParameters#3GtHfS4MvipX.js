export class RequestParameters {
    static id = "3GtHfS4MvipX";
    static description = "Formulates a statement in which the agent requires the user to provide parameters for an operation he wants to execute";

    constructor() {
    }

    async start(context) {
        let flow = system.space.getFlow(context.flowId);
        let parameters = flow.class.inputSchema.filter((parameter) => {
            return context.missingParameters.includes(parameter.name);
        });

        this.prompt = `Your purpose right now is to formulate a statement or a question in which you require the user to provide you with these missing parameters: ${JSON.stringify(parameters)} for this operation: ${flow.class.description}.`;
        this.setDefaultValues();
        this.setIntelligenceLevel(3);
        await this.execute();
    }

    async execute() {
        let agent = system.space.agent;
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        this.return(response);
    }
}