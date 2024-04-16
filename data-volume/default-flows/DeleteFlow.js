export class DeleteFlow {
    static description = "Deletes a flow";
    async start(context) {
        try {
            await assistOS.space.deleteFlow(context.flowName, context.appId);
            this.return(context.flowName);
        } catch (e) {
            this.fail(e);
        }
    }
}