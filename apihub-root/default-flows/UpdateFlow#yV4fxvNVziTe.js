export class UpdateFlow {
    static id = "yV4fxvNVziTe";
    static description = "Updates a flow";
    constructor() {

    }

    async start(flowId, flowData, appId) {
        try {
            flowData = "return " + flowData;
            const classConstructor = new Function(flowData);
            const flowClass = classConstructor();
            await webSkel.currentUser.space.updateFlow(flowId, flowClass, appId);
            this.return(flowId);
        } catch (e) {
            this.fail(e);
        }
    }
}