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

class FindObjectsByValue extends IFlow {
    static flowMetadata = {
        action: "Finds information in the system based on the values provided",
        intent: "Find objects by value",
    };
    static flowParametersSchema = {

    }

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let agent = assistOS.space.getAgent();
            let prompt = `Your task right now is to find objects in the OS that can be identified by IDs, values or names in this conversation history. Here's all the system information available: ${JSON.stringify(await assistOS.space.simplifySpace())}. Put all found objects as they are in an array. Your response should look like this: {"objects": [object 1, object 2, ... ,object n]}. If you didn't find any objects the array should be empty`;
            let llm = assistOS.space.getLLM();
            llm.setResponseFormat("json_object");
            let response = await llm.chatbot(prompt, "", agent.getContext());
            apis.success(JSON.parse(response));
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

module.exports = FindObjectsByValue;
