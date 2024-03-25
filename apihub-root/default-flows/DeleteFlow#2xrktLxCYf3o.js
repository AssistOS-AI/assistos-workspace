export class DeleteFlow {
    static id = "2xrktLxCYf3o";
    static description = "Deletes a flow";
    async start(context) {
        try {
            await system.space.deleteFlow(context.flowId, context.appId);
            this.return(context.flowId);
        } catch (e) {
            this.fail(e);
        }
    }
}