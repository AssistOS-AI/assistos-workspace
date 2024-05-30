class GenerateImage {
    static description = "Generates an image based on a prompt";
    static inputSchema = {
        spaceId: "string",
        prompt: "string",
        variants: "string"
    };
    async start(context) {
        try {
            let llmModule = await this.loadModule("llm");
            let modelConfigs = {
                modelName: context.modelName,
                prompt: context.prompt,
                variants: context.variants,
                responseFormat: context.responseFormat
            }
            let images = await llmModule.generateImage(context.spaceId, modelConfigs);
            this.return(images);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = GenerateImage;