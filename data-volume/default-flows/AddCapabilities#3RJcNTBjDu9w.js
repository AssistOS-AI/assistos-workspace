export class AddCapabilities{
    static id = "3RJcNTBjDu9w";
    static description = "Adds capabilities to the agent, based on the applications that are installed in the system";
    static outputSchema = {
            capabilities:["string"]
    }
    async start() {
        try {
            let flows = assistOS.space.getAllFlows();
            let agentFlows = flows.filter((flow) =>{
                if(flow.class.inputSchema){
                        return flow;
                }
            });

            let operations = agentFlows.filter((flow) => flow.class.inputSchema).map((flow) => ({
                description: flow.class.description,
            }));
            let llm = assistOS.space.getLLM();

            let prompt = `Here is a list of tasks that a custom GPT assistant can perform in a software application: ${JSON.stringify(operations)}. For each of them, summarize their description in a minimum amount of words. Use uppercase for every first letter of a word. Your response should look like this: {"capabilities":["summary 1", "summary 2", ... , "summary n"]}`;
            llm.setResponseFormat("json_object");
            let agent = assistOS.space.getAgent();
            let response = await llm.request(prompt);
            let obj = JSON.parse(response);
            //assistOS.services.validateSchema(obj, AddCapabilities.outputSchema, "output");
            for (let capability of obj.capabilities) {
                await agent.addCapability(capability);
            }
            this.return(response);
        } catch (e) {
            this.fail(e);
        }
    }

}