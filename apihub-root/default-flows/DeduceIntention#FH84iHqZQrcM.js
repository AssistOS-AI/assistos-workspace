export class DeduceIntention {
    static id = "FH84iHqZQrcM";
    static description = "Deduces the intention of the user when speaking to an agent";
    async start(context) {
        let agent = system.space.agent;
        let flows = system.space.getAllFlows();
        let agentFlows = flows.filter((flow) => {
            if(flow.class.inputSchema){
                    return flow;
            }
        });
        let operations = agentFlows.filter((flow) => flow.class.inputSchema)
            .map((flow) => ({
                id: flow.class.id,
                description: flow.class.description,
            }));
        let systemMessage = `You are a custom GPT agent designed for specific tasks in a software application. Your purpose right now is to figure out what operation the user is trying to accomplish using your help. Here is a list of operations that you are capable of doing and their ID's: ${JSON.stringify(operations)}. Using only this list, figure out what operation the user is trying to do. Your response should be like this: {"flowId" : "id of the operation"}`;
        await agent.addMessage("system", systemMessage);
        this.prompt = context.request;
        this.setResponseFormat("json_object");
        this.execute(agent);
    }

    async execute(agent) {
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        this.return(JSON.parse(response));
    }
}