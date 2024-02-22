export class ConfirmFlowExecution {
    static id = "2qTh1JoDiLS3";
    static description = "Generates a user-friendly message that confirms that the operation has been executed successfully";

    constructor() {
    }

    async start(flowId, parameters, result, spaceObjects) {
        try {
            let agent = webSkel.currentUser.space.agent;
            let flow = webSkel.currentUser.space.getFlow(flowId);
            let context = `You are a custom GPT agent designed for specific tasks in an operating system. There may be multiple applications installed in this system and you can find them here${JSON.stringify(spaceObjects)}. You have successfully executed the operation that has this description: ${flow.class.description} which had these necessary parameters: ${JSON.stringify(flow.class.parameters)}. You have executed the operation using these parameters: ${JSON.stringify(parameters)}. Redirect the user to the application responsible of the operation if the result of the operation is not visible here`;
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