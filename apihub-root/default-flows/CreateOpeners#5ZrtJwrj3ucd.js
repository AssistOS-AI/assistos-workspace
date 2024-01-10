export class CreateOpeners {
    static id = "5ZrtJwrj3ucd";
    static description = "Creates openers for the agent based on its capabilities.";
    constructor() {

    }

    async start(capabilities, openersCount) {
        try {
            this.prompt = `You are a custom GPT agent designed for specific tasks in a software application. Your capabilities are as follows:\n${capabilities}\n\n. Given these capabilities, please create ${openersCount} openers for a conversation with a client who is using this application. Enumerate some of these capabilities in these openers. The response should have the following JSON format: {"openers":["opener 1", "opener 2", ... , "opener n"]}`;
            this.setDefaultValues();
            this.setResponseFormat("json_object");
            this.setIntelligenceLevel(3);
            this.execute();
        } catch (e) {
            this.fail(e);
        }
    }

    async execute() {
        let response = await this.request(this.prompt);
        try {
            let openers = JSON.parse(response);
            await webSkel.currentUser.space.agent.setOpeners(openers.openers);
        } catch (e) {
            this.fail(e);
        }
        this.return(response);
    }
}