export class UpdateFlow {
    static description = "Updates a flow";
    async start(context) {
        try {
            let flowModule = await this.loadModule("flow");
            context.flowData = "return " + context.flowData;
            const classConstructor = new Function(context.flowData);
            const flowClass = classConstructor();
            await flowModule.updateFlow(context.spaceId, context.flowName, flowClass.toString());
            this.return(context.flowName);
        } catch (e) {
            this.fail(e);
        }
    }
}