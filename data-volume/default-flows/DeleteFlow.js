export class DeleteFlow {
    static description = "Deletes a flow";
    async start(context) {
        try {
            let flowModule = await this.loadModule("flow");
            await flowModule.deleteFlow(context.spaceId, context.flowName);
            this.return(context.flowName);
        } catch (e) {
            this.fail(e);
        }
    }
}