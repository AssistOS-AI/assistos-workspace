export class ConfirmFlowExecution {
    static id = "2qTh1JoDiLS3";

    constructor() {
        this.name = "ConfirmFlowExecution";
        this.description = "Generates a user-friendly message that confirms that the operation has been executed successfully";
    }

    async start(flowId, parameters, result) {
        try {
            let agent = webSkel.currentUser.space.agent;
            let flow = webSkel.currentUser.space.getFlow(flowId);
            let context = `You are a custom GPT agent designed for specific tasks in a software application. You have successfully executed the operation that has this description: ${flow.agentConfigs.description} which had these necessary parameters: ${JSON.stringify(flow.agentConfigs.parameters)}. You have executed the operation using these parameters: ${JSON.stringify(parameters)}. `;
            await agent.addMessage("system", context);

            this.prompt = `Please determine if the following message is user-friendly and reflects the result of the operation executed: ${result}. If it is not user-friendly, generate a user-friendly message that says that you have successfully executed the operation. Include the result if it provides any additional semantic meaning to the response. You may also include the most useful parameters of the operation in your response. Return only the user-friendly message`;

            this.setDefaultValues();
            this.setIntelligenceLevel(3);
            this.execute(agent);
        } catch (e) {
            this.fail(e);
        }
    }

    async execute(agent) {
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        this.return(response);
    }
}