export class GenerateChapters {
    static id = "2Piuqy6QAW4s";
    static description = "Generates chapters based on some ideas";
    static inputSchema = {
        documentId: "string",
        ideas: "array",
        chapterNr: "string",
    };
    constructor() {
    }

    async start(context) {
        let document = system.space.getDocument(context.documentId);
        this.prompt = `${context.prompt || "Please generate chapters based on the following array of ideas"}: "${context.ideas}" and "${document.getMainIdeas()}". Generate ${context.chapterNr || "3"} chapters. Please put all chapters in an array. A chapter should have the following structure:\n{\"title\":\"Chapter Title\", \"mainIdeas\":[\"paragraph 1 summary\", \"paragraph 2 summary\", ..., \"paragraph n summary\"], \"paragraphs\":[{\"text\":\"paragraph 1 text\", \"mainIdea\":\"paragraph 1 summary\"}, {\"text\":\"paragraph 2 text\", \"mainIdea\":\"paragraph 2 summary\"}, ..., {\"text\":\"paragraph n text\", \"mainIdea\":\"paragraph n summary\"}]}.`;
        await this.execute(document);
    }

    async execute(document) {
        let chapters = await this.request(this.prompt);
        try {
            let chaptersObj = JSON.parse(chapters);
            await document.addChapters(chaptersObj);
            this.return(chaptersObj);
        } catch (e) {
            this.fail(e);
        }
    }
}