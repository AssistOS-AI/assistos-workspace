const Task = require('./Task');
const space = require("../spaces-storage/space");
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
            const paragraph= await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
            /* the image of the precedent paragraph if it exists or throw error */
            /* todo why dont we have everything in one place? => one type of paragraph, that contains everything */
            await llmModule.lipSync(this.spaceId, paragraph.cparagraph.config.audio.src, this.audioSrc, "PlayHT2.0", this.configs);
            await documentModule.updateParagraphConfig(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
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
                ttsCommand: this.ttsCommand,
                prompt: this.prompt
            }
        }
    }
}
module.exports = LipSync;
