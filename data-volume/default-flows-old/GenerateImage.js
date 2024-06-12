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
            let spaceId = context.spaceId;
            delete context.spaceId;
            let images = await llmModule.generateImage(spaceId, context);
            this.return(images);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = GenerateImage;