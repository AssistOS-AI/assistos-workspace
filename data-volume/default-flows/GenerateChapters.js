export class GenerateChapters {
    static description = "Generates chapters based on some ideas";
    static inputSchema = {
        documentId: "string",
        ideas: "array",
        chapterNr: "string",
    };
    constructor() {
    }

    async start(context) {
        let document = assistOS.space.getDocument(context.documentId);
        let prompt = `${context.prompt || "Please generate chapters based on the following array of ideas"}: "${context.ideas}" and "${document.mainIdeas}". Generate ${context.chapterNr || "3"} chapters. Please put all chapters in an array. A chapter should have the following structure:\n{\"title\":\"Chapter Title\", \"mainIdeas\":[\"paragraph 1 summary\", \"paragraph 2 summary\", ..., \"paragraph n summary\"], \"paragraphs\":[{\"text\":\"paragraph 1 text\", \"mainIdea\":\"paragraph 1 summary\"}, {\"text\":\"paragraph 2 text\", \"mainIdea\":\"paragraph 2 summary\"}, ..., {\"text\":\"paragraph n text\", \"mainIdea\":\"paragraph n summary\"}]}.`;
        let llm = assistOS.space.getLLM();
        let chapters = await llm.request(prompt);
        try {
            let chaptersObj = JSON.parse(chapters);
            await document.addChapters(chaptersObj);
            this.return(chaptersObj);
        } catch (e) {
            this.fail(e);
        }
    }
}