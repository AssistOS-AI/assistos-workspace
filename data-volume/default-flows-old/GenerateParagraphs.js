class GenerateParagraphs {
    static description = "Generates paragraphs based on some ideas";
    static inputSchema = {
        documentId: "string",
        chapterId: "string",
        ideas: "array",
        paragraphsNr: "string",
    };

    constructor() {
    }

    async start(context) {
        let documentModule = this.loadModule("document");
        let chapter = await documentModule.getChapter(context.spaceId, context.documentId, context.chapterId);
        let prompt = `${context.prompt || "Please generate paragraphs based on the following array of ideas"}: "${context.ideas}\" and "${chapter.getMainIdeas()}". Generate ${context.paragraphsNr || "3"}. The response should have the following structure: {"paragraphs":[{"text":"paragraph 1 text", "mainIdea": "summary of paragraph 1"}, {"text":"paragraph 2 text", "mainIdea": "summary of paragraph 2"}, ... , {"text":"paragraph n text", "mainIdea": "summary of paragraph n"}]}.`;
        let llm = assistOS.space.getLLM();
        llm.setResponseFormat("json_object");
        let paragraphs = await llm.request(prompt);
        try{
            let paragraphsObj = JSON.parse(paragraphs);
            for(let paragraph of paragraphsObj.paragraphs){
                documentModule.addParagraphs(context.spaceId, context.documentId, context.chapterId, paragraph);
            }
            this.return(paragraphsObj);
        }catch(e){
            this.fail(e);
        }
    }
}
module.exports = GenerateParagraphs;