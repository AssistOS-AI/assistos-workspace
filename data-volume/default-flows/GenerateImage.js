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
            let images = await llmModule.generateImage(context.spaceId, "DALL-E-2", context.prompt, context.variants);
            this.return(images);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = GenerateImage;