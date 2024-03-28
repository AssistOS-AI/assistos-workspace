export class AddTask {
    static id = "3duG9z8khsuX";
    static description = "Adds a task for the agent";
    async start(context) {
        try {
            await system.space.agent.addTask(context.description, context.date);
            this.return(context.description);
        } catch (e) {
            this.fail(e);
        }
    }
}