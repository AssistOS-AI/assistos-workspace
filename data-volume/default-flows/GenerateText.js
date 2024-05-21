class GenerateText {
   static description = "Generates text based on some requirements.";
   static inputSchema = {
      requirements: "string"
   };
   async start(context){
        let llm = assistOS.space.getLLM();
        let prompt = `Please generate some text based on these requirements: ${context.requirements}`;
        return await llm.request(prompt);
   }
}
module.exports = GenerateText;