export class ConfirmFlowExecution {
    static description = "Generates a user-friendly message that confirms that the operation has been executed successfully";
    async start(context) {
        try {
            let agent = assistOS.space.getAgent();
            let flow = assistOS.space.getFlow(context.flowId);
            let systemMessage = `There may be multiple applications installed in this system and you can find them here${JSON.stringify(context.spaceObjects)}. You have successfully executed the operation that has this description: ${flow.class.description} which had these necessary parameters: ${JSON.stringify(flow.class.parameters)}. You have executed the operation using these parameters: ${JSON.stringify(context.parameters)}. Redirect the user to the application responsible of the operation if the result of the operation is not visible here`;
            await agent.addMessage("system", systemMessage);
            let prompt = `Please determine if the following message is user-friendly and reflects the result of the operation executed: ${context.result}. If it is not user-friendly, generate a user-friendly message that says that you have successfully executed the operation. Include the result if it provides any additional semantic meaning to the response. You may also include the most useful parameters of the operation in your response. Return only the user-friendly message`;
            let llm = assistOS.space.getLLM();
            let response = await llm.chatbot(prompt, "", agent.getContext());
            this.return(response);
        } catch (e) {
            this.fail(e);
        }
    }

}