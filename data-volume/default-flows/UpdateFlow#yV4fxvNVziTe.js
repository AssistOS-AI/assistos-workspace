export class UpdateFlow {
    static id = "yV4fxvNVziTe";
    static description = "Updates a flow";
    async start(context) {
        try {
            context.flowData = "return " + context.flowData;
            const classConstructor = new Function(context.flowData);
            const flowClass = classConstructor();
            await system.space.updateFlow(context.flowId, flowClass, context.appId);
            this.return(context.flowId);
        } catch (e) {
            this.fail(e);
        }
    }
}