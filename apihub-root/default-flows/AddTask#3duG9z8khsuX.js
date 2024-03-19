export class AddTask {
    static id = "3duG9z8khsuX";
    static description = "Adds a task for the agent";
    constructor() {

    }

    async start(description, date) {
        try {
            await system.space.agent.addTask(description, date);
            this.return(description);
        } catch (e) {
            this.fail(e);
        }
    }
}