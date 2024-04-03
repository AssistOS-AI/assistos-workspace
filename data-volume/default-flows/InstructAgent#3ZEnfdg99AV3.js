export class InstructAgent {

   static id = "3ZEnfdg99AV3" 
   static description = "description";

   async start(context) {
      let agent = system.space.agent;
      let flows = system.space.getAllFlows();
      let agentFlows = flows.filter((flow) => {
         if(flow.class.inputSchema){
            return flow;
         }
      });
      let operations = agentFlows.filter((flow) => flow.class.inputSchema)
          .map((flow) => ({
             id: flow.class.id,
             description: flow.class.description,
          }));
      let systemMessage = `Your purpose right now is to figure out if the user is trying to accomplish a task using your help. Here is a list of operations that you are capable of doing and their ID's: ${JSON.stringify(operations)}. Take into consideration the current context of the OS which is this:${JSON.stringify(system.context)}. In order to complete this task come up with a plan that consists of a list of operations that you need to execute in a certain order. Your response should be JSON and look like this: {"flowIds":["operation id 1", "operation id 2", ..., "operation id 3"]} or {"no_task":"no task found"}`;
      await agent.addMessage("system", systemMessage);
      this.prompt = context.request;
      this.setResponseFormat("json_object");
      await this.execute(agent);
   }

   async execute(agent) {
      let response = await this.chatbot(this.prompt, "", agent.getContext());
      this.return(JSON.parse(response));
   }
}