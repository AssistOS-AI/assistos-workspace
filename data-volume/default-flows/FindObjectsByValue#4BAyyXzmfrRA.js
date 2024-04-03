export class FindObjectsByValue {
    static id = "4BAyyXzmfrRA";
    static description = "Finds information in the system based on the values provided";
    constructor() {

    }

    async start() {
        try {
            let agent = system.space.getAgent();
            this.prompt = `Your task right now is to find objects in the OS that can be identified by IDs, values or names in this conversation history. Here's all the system information available: ${JSON.stringify(system.space.simplifySpace())}. Put all found objects as they are in an array. Your response should look like this: {"objects": [object 1, object 2, ... ,object n]}. If you didn't find any objects the array should be empty`;
            this.setResponseFormat("json_object");
            this.execute(agent);
        } catch (e) {
            this.fail(e);
        }
    }

    async execute(agent) {
        let response = await this.chatbot(this.prompt, "", agent.getContext());
        try {
            this.return(JSON.parse(response));
        } catch (e) {
            this.fail(e);
        }
    }
}