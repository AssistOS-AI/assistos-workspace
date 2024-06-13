class IFlow {
    constructor() {
        const schema = this.constructor.flowParametersSchema;
        const metadata = this.constructor.flowMetadata;

        if (!schema) {
            throw new Error("Flow inputParametersValidationSchema is required");
        }
        if (!metadata) {
            throw new Error("Flow metadata is required");
        } else {
            if (!metadata.intent) {
                throw new Error("Flow flowMetadata.intent is required");
            }
            if (!metadata.action) {
                throw new Error("Flow flowMetadata.action is required");
            }
        }
    }

    loadModule(moduleName) {
        return require("assistos").loadModule(moduleName, this.__securityContext);
    }

    validateParameters(flowParameters) {
        const schema = this.constructor.flowParametersSchema;
        for (let key in schema) {
            if (schema[key].required && !flowParameters[key]) {
                throw new Error(`Parameter ${key} is required`);
            }
        }
    }

    genericReject(promiseFnc, error) {
        promiseFnc.reject({
            success: false,
            message: error.message,
            statusCode: error.statusCode || 500
        });
    }

    resolve(promiseFnc, data) {
        promiseFnc.resolve({
            success: true,
            data: data
        });
    }

    reject(promiseFnc, error) {
        promiseFnc.reject({
            success: false,
            message: error.message,
            statusCode: error.statusCode || 500
        });
    }
}

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

    async execute(parameters) {
        return new Promise(async (resolve, reject) => {
            const apis = {
                success: (data) => this.resolve({ resolve }, data),
                fail: (error) => this.reject({ reject }, error),
                loadModule: (moduleName) => this.loadModule(moduleName, this.__securityContext)
            };
            try {
                this.validateParameters(parameters);
                await this.userCode(apis, parameters);
            } catch (error) {
                this.genericReject(reject, error);
            }
        });
    }
}

module.exports = GenerateChapters;
