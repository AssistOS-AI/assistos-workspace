export class AddTask {
    static id = "3duG9z8khsuX";
    static description = "Adds a task for the agent";
    constructor() {

    }

    async start(context) {
        try {
            await system.space.agent.addTask(context.description, context.date);
            this.return(description);
        } catch (e) {
            this.fail(e);
        }
    }
}