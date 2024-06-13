const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class ConfirmTaskCompletion extends IFlow {
   static flowMetadata = {
      action: "Formulates a statement summarizing the completed task",
      intent: "Confirm task completion",
   };

   static flowParametersSchema = {};

   constructor() {
      super();
   }

   async userCode(apis, parameters) {
      try {
         let prompt = "Your task right now is to formulate a statement in which you confirm and sum up the task that you have completed. The statement should be clear and concise.";
         let agent = assistOS.space.getAgent();
         let llm = assistOS.space.getLLM();
         let response = await llm.chatbot(prompt, "", agent.getContext());
         apis.success(response);
      } catch (e) {
         apis.fail(e);
      }
   }

}

module.exports = ConfirmTaskCompletion;
