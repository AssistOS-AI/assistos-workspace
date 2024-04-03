export class ExecuteMultipleFlows {

    static id = "56rDpcZnwhJN"
    static description = "Executes multiple flows in a sequence in a sequence using given parameters";

    async start(context) {
        let responses = [];
        for (let item of context.extractedParameters) {
            let flow = system.space.getFlow(item.flowId);
            let response;
            try {
                response = await system.services.callFlow(flow.id, item.extractedParameters);
            } catch (e) {
               this.fail(e);
            }
            responses.push(response);
        }
        this.return(responses);
    }
}