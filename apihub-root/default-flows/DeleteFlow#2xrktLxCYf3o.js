export class DeleteFlow {
    static id = "2xrktLxCYf3o";

    constructor() {
        this.name = "DeleteFlow";
        this.description = "Deletes a flow";
    }

    async start(flowId, appId) {
        try {
            await webSkel.currentUser.space.deleteFlow(flowId, appId);
            this.return(flowId);
        } catch (e) {
            this.fail(e);
        }
    }
}