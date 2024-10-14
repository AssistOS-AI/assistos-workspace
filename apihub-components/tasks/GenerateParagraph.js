const Task = require('./Task');

class GenerateParagraph extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.configs = configs

    }

    async runTask() {
        const llmModule = require('assistos').loadModule('llm', this.securityContext);
        const openAIPrompt = `Please provide the paragraph content for the paragraph titled ${this.configs.title}`;
        const llmResponse= await llmModule.sendLLMRequest({prompt: openAIPrompt});
    }

    async cancelTask() {
        await this.rollback();
    }

    async rollback() {
        try {

        } catch (e) {

        }
    }


    serialize() {
        return {
            status: this.status,
            id: this.id,
            spaceId: this.spaceId,
            userId: this.userId,
            securityContext: this.securityContext,
            name: this.constructor.name,
            configs: {}
        }
    }

}

module.exports = GenerateParagraph;
