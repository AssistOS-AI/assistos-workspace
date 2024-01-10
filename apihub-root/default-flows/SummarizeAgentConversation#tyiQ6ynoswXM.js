export class SummarizeAgentConversation {
    static id = "tyiQ6ynoswXM";
    static description = "Summarizes the conversation by creating the main ideas of the three entities: user, assistant, and system.";

    constructor() {

    }

    start() {
        let agent = webSkel.currentUser.space.agent;
        this.prompt = `Please summarize the following conversation between a user and an AI model: "${JSON.stringify(agent.conversationHistory)}" by extracting key information about the discussion. The assistant's role is to answer to the user's needs and perform certain tasks in a software application. System messages are used to instruct the model about the context of the conversation. Include in the summary any potential parameters and their values and operations that the assistant may use for his tasks.`;
        this.setDefaultValues();
        this.setIntelligenceLevel(3);
        this.execute();
    }

    async execute() {
        let summary = await this.summarize(this.prompt);
        this.return(summary);
    }
}
