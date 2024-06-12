class IFlow {
    constructor(flowInstance) {
        if (!flowInstance.flowParametersSchema) {
            throw new Error("Flow inputParametersValidationSchema is required");
        }
        if (!flowInstance.flowMetadata) {
            throw new Error("Flow metadata is required");
        } else {
            if (!flowInstance.flowMetadata.intent) {
                throw new Error("Flow flowMetadata.intent is required");
            }
            if (!flowInstance.flowMetadata.action) {
                throw new Error("Flow flowMetadata.action is required");
            }
        }
    }
    loadModule(moduleName){
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

module.exports = IFlow;
