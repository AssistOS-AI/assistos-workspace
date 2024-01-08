export class DeduceIntention {
    static id = "FH84iHqZQrcM";

    constructor() {
        this.name = "DeduceIntention";
        this.description = "Deduces the intention of the user when speaking to an agent";
    }

    async start(request) {
        let agent = webSkel.currentUser.space.agent;
        let agentFlows = webSkel.currentUser.space.flows.filter((flow) => flow.tags.includes("agents"));
        let operations = agentFlows.filter((flow) => flow.agentConfigs)
            .map((flow) => ({
                id: flow.id,
                description: flow.agentConfigs.description,
            }));
        let context = `You are a custom GPT agent designed for specific tasks in a software application. Your purpose right now is to figure out what operation the user is trying to accomplish using your help. Here is a list of operations that you are capable of doing and their ID's: ${JSON.stringify(operations)}. Using only this list, figure out what operation the user is trying to do. If you found an operation that matches the user's request, your response must only be the ID of the operation. DO NOT respond with additional text. If none of these operations match the user's request, your response must be an empty string.`;
        await agent.addMessage("system", context);
        this.prompt = request;
        this.setDefaultValues();
        this.setIntelligenceLevel(3);
        this.execute(agent);
    }

    async execute(agent) {
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        this.return(response);
    }
}