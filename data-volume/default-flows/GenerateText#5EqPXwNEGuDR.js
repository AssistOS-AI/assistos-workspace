export class GenerateText {

   static id = "5EqPXwNEGuDR" 
   static description = "Generates text based on some requirements.";
   static inputSchema = {
      requirements: "string"
   };
   async start(context){
        this.prompt = `Please generate some text based on these requirements: ${context.requirements}`;
        return await this.request(this.prompt);
   }
}