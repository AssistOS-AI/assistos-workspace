export class GenerateDocument {
    static description = "Generates a whole document based on: a title, a topic, number of chapters";
    static inputSchema = {
        title: "string",
        topic: "string",
        chaptersCount: "string"
    }
    constructor() {
    }

    async start(context, personality) {
        let personalityPrompt;
        personalityPrompt = `Step into the shoes of ${personality.name}, a character known for their distinctive traits: ${personality.description}. Your mission is to respond to the following prompt in such a way that it encapsulates the distinct essence of this character. Don't reiterate ${personality.name}'s traits in your answer. `;
        this.llm = assistOS.space.getLLM();
        this.llm.setResponseFormat("json_object");
        this.llm.addSystemMessage(personalityPrompt);
        let schema = await this.generateSchema(context.title, context.topic, context.chaptersCount);
        let chapters = await this.generateChapters(schema);
        this.llm.setResponseFormat("text");
        let mainIdeas = await this.generateMainIdeas(chapters);
        let abstract = await this.generateAbstract(mainIdeas);
        await this.addDocument(context.title, context.topic, chapters, mainIdeas, abstract);
        this.return(context.title);
    }

    async generateSchema(title, topic, chaptersCount) {
        const documentSchemaPrompt = `Please generate a schema for a document. The topic of this document is ${topic} and it should have ${chaptersCount} chapters. The title is ${title}. The schema should have the following format: {\"title\": \"Title of the document\",\"chapters\": [${countChapters(chaptersCount)}]}`;

        function countChapters(chaptersCount) {
            let chapters = '';
            for (let i = 0; i < chaptersCount; i++) {
                chapters += `{\"title\": \"Chapter ${i} title\",\"mainIdeas\": [\"Chapter ${i} idea 1\", \"Chapter ${i} idea 2\", ..., \"Chapter ${i} idea n\"]}`;
                if (i <= chaptersCount) {
                    chapters += ', ';
                }
            }
            return chapters;
        }

        let schema = await this.llm.request(documentSchemaPrompt);
        try {
            return JSON.parse(schema);
        } catch (e) {
            this.fail(e);
        }
    }

    async generateChapters(schema) {
        let generatedChapters = [];
        let previousChapters;

        for (let i = 0; i < schema.chapters.length; i++) {
            if (i > 0) {
                const includedAttributes = ['title', 'mainIdeas'];
                let minimizedChapters = generatedChapters.map(obj => {
                    // Using object destructuring and filter to keep only specified attributes
                    return Object.fromEntries(
                        Object.entries(obj).filter(([key]) => includedAttributes.includes(key))
                    );
                });
                previousChapters = `Use a logical flow in your generation and continue your writing flow using these previous chapters and their main ideas:${JSON.stringify(minimizedChapters)}.`;
            }
            let generateChapterPrompt = `Please generate a chapter that is strictly related to these main ideas: ${JSON.stringify(schema.chapters[i].mainIdeas)} and this title:${schema.chapters[i].title}. ${previousChapters || ""} The chapter should have the following structure:{\"title\":\"Chapter Title\", \"mainIdeas\":[\"paragraph 1 summary\", \"paragraph 2 summary\", ... , \"paragraph n summary\"], \"paragraphs\":[{text:\"paragraph 1 text\", mainIdea:\"paragraph 1 summary\"}, {text:\"paragraph 2 text\", mainIdea:\"paragraph 2 summary\"}, ... {text:\"paragraph n text\", mainIdea:\"paragraph n summary\"}]}.`;
            let response = await this.llm.request(generateChapterPrompt);
            try {
                generatedChapters.push(JSON.parse(response));
            } catch (e) {
                this.fail(e);
            }
        }
        return generatedChapters;
    }

    async generateMainIdeas(chapters) {
        let mainIdeas = [];
        for (let chapter of chapters) {
            let prompt = `Please summarize these ideas: ${JSON.stringify(chapter.mainIdeas)} into a single idea. Return only the idea`;
            let response = await this.llm.request(prompt);
            mainIdeas.push(response);
        }
        return mainIdeas;
    }

    async generateAbstract(mainIdeas) {
        let prompt = `Please create an abstract for a document that has these main ideas: ${JSON.stringify(mainIdeas)}. Return only the abstract text`;
        return await this.llm.request(prompt);
    }

    async addDocument(title, topic, chapters, mainIdeas, abstract) {
        let documentModule = this.loadModule("document");
        let documentData = {
            title: title,
            topic: topic,
            chapters: chapters,
            mainIdeas: mainIdeas,
            abstract: abstract
        };

        await documentModule.addDocument(documentData);
    }
}
