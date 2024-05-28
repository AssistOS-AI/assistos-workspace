class DeduceIntention {
    static description = "Deduces the intention of the user when speaking to an agent";
    async start(context) {
        let agent = assistOS.agent;
        let flows = assistOS.space.getAllFlows();
        let agentFlows = flows.filter((flow) => {
            if(flow.inputSchema){
                    return flow;
            }
        });
        let operations = agentFlows.filter((flow) => flow.inputSchema)
            .map((flow) => ({
                id: flow.id,
                description: flow.description,
            }));
        let systemMessage = `Your purpose right now is to figure out if the user is trying to accomplish an operation using your help. Here is a list of operations that you are capable of doing and their ID's: ${JSON.stringify(operations)}. Take into consideration the current context of the OS which is this:${JSON.stringify(assistOS.context)}. Your response should be like this: {"flowId" : "id of the operation"} or {"invalid":"no operation found"}`;
        await agent.addMessage("system", systemMessage);
        let llm = assistOS.space.getLLM();
        llm.setResponseFormat("json_object");
        let response = await llm.chatbot(context.request, "", agent.getContext());
        this.return(JSON.parse(response));
    }
}
module.exports = DeduceIntention;