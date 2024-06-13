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

class AddPersonality extends IFlow {
    static flowMetadata = {
        action: "Adds a new personality",
        intent: "Add a new personality",
    };

    static flowParametersSchema = {
        spaceId: {
            type: "string",
            required: true
        },
        name: {
            type: "string",
            required: true
        },
        description: {
            type: "string",
            required: true
        },
        photo: {
            type: "string",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let personalityModule = apis.loadModule("personality");
            let personalityData = {
                name: parameters.name,
                description: parameters.description,
                image: parameters.photo,
                metadata: ["name", "id", "photo"]
            };
            await personalityModule.addPersonality(parameters.spaceId, personalityData);
            apis.success(personalityData);
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

module.exports = AddPersonality;
