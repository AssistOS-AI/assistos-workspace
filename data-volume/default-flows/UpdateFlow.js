export class UpdateFlow {
    static description = "Updates a flow";
    async start(context) {
        try {
            context.flowData = "return " + context.flowData;
            const classConstructor = new Function(context.flowData);
            const flowClass = classConstructor();
            await assistOS.space.updateFlow(context.flowName, flowClass, context.appId);
            this.return(context.flowName);
        } catch (e) {
            this.fail(e);
        }
    }
}