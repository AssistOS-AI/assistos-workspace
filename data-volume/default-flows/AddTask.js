export class AddTask {
    static description = "Adds a task for the agent";
    async start(context) {
        try {
            await assistOS.space.getAgent().addTask(context.description, context.date);
            this.return(context.description);
        } catch (e) {
            this.fail(e);
        }
    }
}