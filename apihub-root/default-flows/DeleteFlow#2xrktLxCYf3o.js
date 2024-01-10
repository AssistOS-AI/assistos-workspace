export class DeleteFlow {
    static id = "2xrktLxCYf3o";
    static description = "Deletes a flow";
    constructor() {

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