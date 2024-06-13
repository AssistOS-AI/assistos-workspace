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

class AddImagesToParagraph extends IFlow {
    static flowMetadata = {
        action: "Inserts an array of images into a paragraph",
        intent: "Add images to a paragraph",
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
        chapterId: {
            type: "string",
            required: true
        },
        paragraphId: {
            type: "string",
            required: true
        },
        offset: {
            type: "string",
            required: true
        },
        imagesData: {
            type: "object",
            required: true
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            let documentModule = apis.loadModule("document");
            let paragraph = await documentModule.getParagraph(parameters.spaceId, parameters.documentId, parameters.paragraphId);
            let imagesIdsString = ` `;
            for (let image of parameters.imagesData.images) {
                imagesIdsString += `{&quot;imageId&quot;:&quot;${image.id}&quot;,&quot;galleryId&quot;:&quot;${parameters.imagesData.galleryId}&quot;} `;
            }
            paragraph.text = paragraph.text.slice(0, parameters.offset) + imagesIdsString + paragraph.text.slice(parameters.offset);
            await documentModule.updateParagraphText(parameters.spaceId, parameters.documentId, parameters.paragraphId, paragraph.text);
            apis.success(parameters.paragraphId);
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

module.exports = AddImagesToParagraph;
