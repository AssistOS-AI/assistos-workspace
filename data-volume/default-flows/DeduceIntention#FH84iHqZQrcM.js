export class DeduceIntention {
    static id = "FH84iHqZQrcM";
    static description = "Deduces the intention of the user when speaking to an agent";
    async start(context) {
        let agent = system.space.getAgent();
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
        let systemMessage = `Your purpose right now is to figure out if the user is trying to accomplish an operation using your help. Here is a list of operations that you are capable of doing and their ID's: ${JSON.stringify(operations)}. Take into consideration the current context of the OS which is this:${JSON.stringify(system.context)}. Your response should be like this: {"flowId" : "id of the operation"} or {"invalid":"no operation found"}`;
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