const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class GenerateChapters extends IFlow {
    static flowMetadata = {
        action: "Generates chapters based on some ideas",
        intent: "Generate chapters based on ideas",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        documentId: {
            type: "string",
            required: true
        },
        ideas: {
            type: "array",
            required: true
        },
        chapterNr: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        let documentModule = apis.loadModule("document");
        let prompt = `${parameters.prompt || "Please generate chapters based on the following array of ideas"}: "${parameters.ideas}" and "${document.mainIdeas}". Generate ${parameters.chapterNr || "3"} chapters. Please put all chapters in an array. A chapter should have the following structure:\n{\"title\":\"Chapter Title\", \"mainIdeas\":[\"paragraph 1 summary\", \"paragraph 2 summary\", ..., \"paragraph n summary\"], \"paragraphs\":[{\"text\":\"paragraph 1 text\", \"mainIdea\":\"paragraph 1 summary\"}, {\"text\":\"paragraph 2 text\", \"mainIdea\":\"paragraph 2 summary\"}, ..., {\"text\":\"paragraph n text\", \"mainIdea\":\"paragraph n summary\"}]}.`;
        let llm = assistOS.space.getLLM();
        let chapters = await llm.request(prompt);
        try {
            let chaptersArray = JSON.parse(chapters);
            for(let chapter of chaptersArray){
                await documentModule.addChapter(chapter);
            }
            apis.success("");
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = GenerateChapters;
