export class Fallback {
    static id = "58DE2tz7wFH6";
    static description = "Tries to come up with a satisfactory answer for the user";

    constructor() {
    }

    async start(userPrompt, spaceObjects) {
        let agent = system.space.agent;
        let context = `You are a custom GPT agent designed for specific tasks in a software application. You have tried to find an operation in the application to execute to answer to the user's needs but you have failed to find any. In this case, you should improvise an answer that is satisfactory. Here are some objects from the system that the user mentioned in his request: ${JSON.stringify(spaceObjects)}. You may use them to formulate your answer. In case you cannot find an answer apologize and inform the user of your configuration and purpose`;

        await agent.addMessage("system", context);
        this.prompt = userPrompt;
        this.setDefaultValues();
        this.setIntelligenceLevel(3);
        this.execute(agent);
    }

    async execute(agent) {
        let response = await this.chatbot(this.prompt, "", agent.conversationHistory);
        this.return(response);
    }
}