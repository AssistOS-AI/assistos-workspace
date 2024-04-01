export class ConfirmTaskCompletion {

   static id = "4ScRh1U1kNYZ" 
   static description = "Formulates a statement which summarizes the task that the agent has completed";

   async start(){
      this.prompt = "Your task right now is to formulate a statement in which you confirm and sum up the task that you have completed. The statement should be clear and concise.";
      let agent = system.space.agent;
      let response = await this.chatbot(this.prompt, "", agent.getContext());
      this.return(response);
   }
}