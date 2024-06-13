const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class GenerateParagraphs extends IFlow {
    static flowMetadata = {
        action: "Generates paragraphs based on some ideas",
        intent: "Generate paragraphs"
    };

    static flowParametersSchema = {
        documentId: {
            type: "string",
            required: true
        },
        chapterId: {
            type: "string",
            required: true
        },
        ideas: {
            type: "array",
            required: true
        },
        paragraphsNr: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let documentModule = apis.loadModule("document");
            let chapter = await documentModule.getChapter(parameters.spaceId, parameters.documentId, parameters.chapterId);
            let prompt = `${parameters.prompt || "Please generate paragraphs based on the following array of ideas"}: "${parameters.ideas}" and "${chapter.getMainIdeas()}". Generate ${parameters.paragraphsNr || "3"}. The response should have the following structure: {"paragraphs":[{"text":"paragraph 1 text", "mainIdea": "summary of paragraph 1"}, {"text":"paragraph 2 text", "mainIdea": "summary of paragraph 2"}, ... , {"text":"paragraph n text", "mainIdea": "summary of paragraph n"}]}.`;
            let llm = assistOS.space.getLLM();
            llm.setResponseFormat("json_object");
            let paragraphs = await llm.request(prompt);
            let paragraphsObj = JSON.parse(paragraphs);

            for (let paragraph of paragraphsObj.paragraphs) {
                await documentModule.addParagraph(parameters.spaceId, parameters.documentId, parameters.chapterId, paragraph);
            }
            apis.success(paragraphsObj);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = GenerateParagraphs;
