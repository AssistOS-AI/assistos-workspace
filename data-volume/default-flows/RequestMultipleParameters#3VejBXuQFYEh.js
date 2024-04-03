export class RequestMultipleParameters {

   static id = "3VejBXuQFYEh"
   static description = "Formulates a statement in which the agent requires the user to provide parameters for multiple operations he wants to execute";

   constructor() {
   }

   async start(context) {
      let missingParameters = []
      for(let item of context.missingParameters) {
            let flow = system.space.getFlow(item.flowId);
            let parameters = Object.keys(flow.class.inputSchema).filter((key) => {
                return item.missingParameters.includes(key);
            });
            missingParameters.push({operationDescription: flow.class.description, parameters: parameters});
      }
      this.prompt = `Your task right now is to formulate a statement or a question in which you require the user to provide you with missing parameters for some operations: ${JSON.stringify(missingParameters)}.`;
      await this.execute();
   }

   async execute() {
      let agent = system.space.getAgent();
      let response = await this.chatbot(this.prompt, "", agent.getContext());
      this.return(response);
   }
}