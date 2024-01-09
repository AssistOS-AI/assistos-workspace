export class AddCapabilities {
    static id = "3RJcNTBjDu9w";

    constructor() {
        this.name = "AddCapabilities";
        this.description = "Adds capabilities to the agent, based on the applications that are installed in the system";
    }

    start(appId) {
        try {
            // Uncomment the following lines if you want to filter flows by application
            // let application = webSkel.currentUser.space.getApplication(appId);
            // let agentFlows = application.flows.filter((flow) => flow.tags.includes("agents"));

            // If you want to filter flows globally across the space, use the line below
            let agentFlows = webSkel.currentUser.space.flows.filter((flow) => flow.tags.includes("agents"));

            let operations = agentFlows.filter((flow) => flow.agentConfigs).map((flow) => ({
                description: flow.agentConfigs.description,
            }));

            this.prompt = `Here is a list of tasks that a custom GPT assistant can perform in a software application: ${JSON.stringify(operations)}. For each of them, summarize their description in a minimum amount of words. Use uppercase for every first letter of a word. Your response should look like this: {"capabilities":["summary 1", "summary 2", ... , "summary n"]}`;

            this.setDefaultValues();
            this.setIntelligenceLevel(3);
            this.setResponseFormat("json_object");
            this.execute();
        } catch (e) {
            this.fail(e);
        }
    }

    async execute() {
        let agent = webSkel.currentUser.space.agent;
        let response = await this.request(this.prompt);
        try {
            let obj = JSON.parse(response);
            for (let capability of obj.capabilities) {
                agent.addCapability(capability);
            }
        } catch (e) {
            this.fail(e);
        }
        this.return(response);
    }
}