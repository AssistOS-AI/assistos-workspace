export class FindObjectsByValue {
    static id = "4BAyyXzmfrRA";

    constructor() {
        this.name = "FindObjectsByValue";
        this.description = "Finds information in the system based on the values provided";
    }

    async start(request) {
        try {
            let agent = webSkel.currentUser.space.agent;
            let context = `You are a custom GPT agent designed for specific tasks in a software application. Your task right now is to find objects in the system that can be identified by some unique information that the user gives you. Ignore other requests from the user. These objects can later be used as parameters for certain operations in the application. Keep in mind that strings and integers can be considered objects. Here's all the system information available: ${JSON.stringify(webSkel.currentUser.space.simplifySpace())}. Put all found objects as they are in an array. Your response should look like this: {"objects": [object 1, object 2, ... ,object n]}. If you didn't find any objects the array should be empty`;
            await agent.addMessage("system", context);

            this.prompt = request;
            this.setDefaultValues();
            this.setResponseFormat("json_object");
            this.setIntelligenceLevel(3);
            this.execute(agent);
        } catch (e) {
            this.fail(e);
        }
    }

    async execute(agent) {
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        try {
            JSON.parse(response);
        } catch (e) {
            this.fail(e);
        }
        this.return(response);
    }
}