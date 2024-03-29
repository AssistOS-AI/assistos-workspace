export class GenerateParagraphs {
    static id = "UikYz7YD2wCm";
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
        let document = system.space.getDocument(context.documentId);
        let chapter = document.getChapter(context.chapterId);
        this.prompt = `${context.prompt || "Please generate paragraphs based on the following array of ideas"}: "${context.ideas}\" and "${chapter.getMainIdeas()}". Generate ${context.paragraphsNr || "3"}. The response should have the following structure: {"paragraphs":[{"text":"paragraph 1 text", "mainIdea": "summary of paragraph 1"}, {"text":"paragraph 2 text", "mainIdea": "summary of paragraph 2"}, ... , {"text":"paragraph n text", "mainIdea": "summary of paragraph n"}]}.`;
        this.setResponseFormat("json_object");
        await this.execute(document, chapter);
    }
    async execute(document, chapter){
        let paragraphs = await this.request(this.prompt);
        try{
            let paragraphsObj = JSON.parse(paragraphs);
            await chapter.addParagraphs(paragraphsObj.paragraphs);
            await system.factories.updateDocument(system.space.id, document);
            this.return(paragraphsObj);
        }catch(e){
            this.fail(e);
        }
    }
}