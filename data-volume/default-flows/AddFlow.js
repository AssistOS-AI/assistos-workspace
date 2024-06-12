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

class AddFlow extends IFlow {
    static flowMetadata = {
        action: "Adds a new flow to be used to execute an operation in the application",
        intent: "User wants to add a new flow",
    };

    static flowParametersSchema = {
        name: {
            required: true,
            type: "string"
        },
        action: {
            required: true,
            type: "string"
        },
        intent: {
            required: true,
            type: "string"
        },
        code: {
            required: true,
            type: "string"
        },
        flowParametersSchema: {
            required: true,
            type: "object"
        }
    };

    constructor() {
        super(AddFlow);
    }

    async userCode(apis, parameters) {
        const flowModule = await apis.loadModule("flow");
        const flowData ={
            name: parameters.name,
            action: parameters.action,
            intent: parameters.intent,
            code: parameters.code,
            flowParametersSchema: parameters.flowParametersSchema
        };
        await flowModule.addFlow(assistOS.space.id,flowData);
        apis.success("Flow added successfully");
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

module.exports = AddFlow;
