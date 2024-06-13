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

class RequestParameters extends IFlow {
    static flowMetadata = {
        action: "Formulates a statement requiring the user to provide parameters for an operation",
        intent: "Request parameters"
    };

    static flowParametersSchema = {
        flowId: {
            type: "string",
            required: true
        },
        missingParameters: {
            type: "array",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let flow = assistOS.space.getFlow(parameters.flowId);
            let requiredParameters = Object.keys(flow.inputSchema).filter((key) => {
                return parameters.missingParameters.includes(key);
            });
            let prompt = `Your task right now is to formulate a statement or a question in which you require the user to provide you with these missing parameters: ${JSON.stringify(requiredParameters)} for this operation: ${flow.description}.`;
            let agent = assistOS.space.getAgent();
            let llm = assistOS.space.getLLM();
            let response = await llm.chatbot(prompt, "", agent.getContext());
            apis.success(response);
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

module.exports = RequestParameters;
