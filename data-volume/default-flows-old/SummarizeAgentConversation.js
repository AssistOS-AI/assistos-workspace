class SummarizeAgentConversation {
    static description = "Summarizes the conversation by creating the main ideas of the three entities: user, assistant, and assistOS.";
    start() {
        let agent = assistOS.space.getAgent();
        this.prompt = `Please summarize the following conversation between a user and an AI model: "${JSON.stringify(agent.conversationHistory)}" by extracting key information about the discussion. The assistant's role is to answer to the user's needs and perform certain tasks in a software application. System messages are used to instruct the model about the context of the conversation. Include in the summary any potential parameters and their values and operations that the assistant may use for his tasks.`;
        this.execute();
    }

    async execute() {
        let llm = assistOS.space.getLLM();
        let summary = await llm.summarize(this.prompt);
        this.return(summary);
    }
}
module.exports = SummarizeAgentConversation;