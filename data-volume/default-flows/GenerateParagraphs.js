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

module.exports = GenerateParagraphs;
