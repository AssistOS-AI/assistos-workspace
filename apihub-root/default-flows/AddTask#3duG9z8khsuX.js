export class AddTask {
    static id = "3duG9z8khsuX";

    constructor() {
        this.name = "AddTask";
        this.description = "Adds a task for the agent";
    }

    async start(description, date) {
        try {
            await webSkel.currentUser.space.agent.addTask(description, date);
            this.return(description);
        } catch (e) {
            this.fail(e);
        }
    }
}