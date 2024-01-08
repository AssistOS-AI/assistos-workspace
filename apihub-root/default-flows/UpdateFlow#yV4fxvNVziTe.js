export class UpdateFlow {
    static id = "yV4fxvNVziTe";

    constructor() {
        this.name = "UpdateFlow";
        this.description = "Updates a flow";
    }

    async start(flowId, flowData, appId) {
        try {
            await webSkel.currentUser.space.updateFlow(flowId, flowData, appId);
            this.return(flowId);
        } catch (e) {
            this.fail(e);
        }
    }
}