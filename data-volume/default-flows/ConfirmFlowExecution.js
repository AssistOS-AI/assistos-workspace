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

class ConfirmFlowExecution extends IFlow {
    static flowMetadata = {
        action: "Generates a user-friendly message that confirms the operation execution",
        intent: "Confirm the operation execution",
    };

    static flowParametersSchema = {
        flowId: {
            type: "string",
            required: true
        },
        spaceObjects: {
            type: "object",
            required: true
        },
        parameters: {
            type: "object",
            required: true
        },
        result: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let agent = assistOS.space.getAgent();
            let flow = assistOS.space.getFlow(parameters.flowId);
            let systemMessage = `There may be multiple applications installed in this system and you can find them here${JSON.stringify(parameters.spaceObjects)}. You have successfully executed the operation that has this description: ${flow.description} which had these necessary parameters: ${JSON.stringify(flow.parameters)}. You have executed the operation using these parameters: ${JSON.stringify(parameters.parameters)}. Redirect the user to the application responsible for the operation if the result of the operation is not visible here`;
            await agent.addMessage("system", systemMessage);
            let prompt = `Please determine if the following message is user-friendly and reflects the result of the operation executed: ${parameters.result}. If it is not user-friendly, generate a user-friendly message that says that you have successfully executed the operation. Include the result if it provides any additional semantic meaning to the response. You may also include the most useful parameters of the operation in your response. Return only the user-friendly message`;
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

module.exports = ConfirmFlowExecution;
