export class CreateOpeners {
    static description = "Creates openers for the agent based on its capabilities.";
    async start(context) {
        try {
            let prompt = `You are a custom GPT agent designed for specific tasks in a software application. Your capabilities are as follows:\n${context.capabilities}\n\n. Given these capabilities, please create ${context.openersCount} openers for a conversation with a client who is using this application. Enumerate some of these capabilities in these openers. The response should have the following JSON format: {"openers":["opener 1", "opener 2", ... , "opener n"]}`;
            let llm = assistOS.space.getLLM();
            llm.setResponseFormat("json_object");
            let response = await llm.request(prompt);
            let openers = JSON.parse(response);
            await assistOS.space.getAgent().setOpeners(openers.openers);
            this.return(openers);
        } catch (e) {
            this.fail(e);
        }
    }

}