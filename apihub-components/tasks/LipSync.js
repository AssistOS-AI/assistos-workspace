const Task = require('./Task');
class LipSync extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.documentId = configs.documentId;
        this.paragraphId = configs.paragraphId;
    }
    async runTask() {
        try {
            const llmModule = require('assistos').loadModule('llm', this.securityContext);
            const documentModule = require('assistos').loadModule('document', this.securityContext);
            const utilModule = require('assistos').loadModule('util', this.securityContext);
            await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "lipsync").VALIDATE(this.spaceId, this.documentId, this.paragraphId, this.securityContext);

            const paragraphConfig= await documentModule.getParagraphConfig(this.spaceId, this.documentId, this.paragraphId);
            await llmModule.lipSync(this.spaceId,paragraphConfig.image.src, paragraphConfig.audio.src, "PlayHT2.0");
        } catch (e) {
            await this.rollback();
            throw e;
        }
    }

    async rollback() {
        try {

        } catch (e){
            //no audio to delete
        }
    }
    async cancelTask() {
        await this.rollback();
    }

    serialize() {
        return {
            status: this.status,
            id: this.id,
            spaceId: this.spaceId,
            userId: this.userId,
            securityContext: this.securityContext,
            name: this.constructor.name,
            configs: {
                documentId: this.documentId,
                paragraphId: this.paragraphId,
            }
        }
    }
}
module.exports = LipSync;
