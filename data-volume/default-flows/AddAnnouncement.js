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

class AddAnnouncement extends IFlow {
    static flowMetadata = {
        action: "Adds a new announcement to the current space",
        intent: "User wants to add an announcement",
    };

    static flowParametersSchema = {
        title: {
            type: "string",
            required: true
        },
        text: {
            type: "string",
            required: true
        }
    };

    constructor() {
        super(AddAnnouncement);
    }

    async userCode(apis, parameters) {
        let spaceModule = apis.loadModule("space");
        let announcementData = {
            title: parameters.title,
            text: parameters.text,
        };
        await spaceModule.addSpaceAnnouncement(assistOS.space.id, announcementData);
        apis.success(announcementData);
    }

    async execute(extractedParameters) {
        return new Promise(async (resolve, reject) => {
            const apis = {
                success: (data) => this.resolve({ resolve }, data),
                fail: (error) => this.reject({ reject }, error),
                loadModule: (moduleName) => this.loadModule(moduleName,this.__securityContext)
            };
            try {
                this.validateParameters(extractedParameters);
                await this.userCode(apis, extractedParameters);
            } catch (error) {
                this.genericReject(reject, error);
            }
        });
    }
}

module.exports = AddAnnouncement;
