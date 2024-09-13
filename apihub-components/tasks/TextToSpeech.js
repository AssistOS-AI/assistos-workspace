const Task = require('./Task');
const crypto = require("../apihub-component-utils/crypto");
const space = require("../spaces-storage/space");
class TextToSpeech extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.documentId = configs.documentId;
        this.paragraphId = configs.paragraphId;
    }
    async runTask() {
        try {
            const llmModule = require('assistos').loadModule('llm', this.securityContext);
            const documentModule = require('assistos').loadModule('document', this.securityContext);
            const personalityModule = require('assistos').loadModule('personality', this.securityContext);
            const utilModule = require('assistos').loadModule('util', this.securityContext);

            await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").VALIDATE(this.spaceId, this.documentId, this.paragraphId, this.securityContext);

            const paragraphConfig = await documentModule.getParagraphConfig(this.spaceId, this.documentId, this.paragraphId);
            const personalityData = await personalityModule.getPersonalityByName(this.spaceId, paragraphConfig.commands["speech"].personality);

            const audioBlob = await llmModule.textToSpeech(this.spaceId, {
                prompt: this.prompt,
                voice: personalityData.voiceId,
                emotion:paragraphConfig.commands["speech"].paramsObject.emotion,
                styleGuidance: paragraphConfig.commands["speech"].paramsObject.styleGuidance,
                voiceGuidance: paragraphConfig.commands["speech"].paramsObject.voiceGuidance,
                temperature: paragraphConfig.commands["speech"].paramsObject.temperature,
                modelName: "PlayHT2.0"
            });

            this.audioId = crypto.generateId();
            paragraphConfig.audio = {
                id: this.audioId,
                src: `spaces/audio/${this.spaceId}/${this.audioId}`
            }
            await documentModule.updateParagraphConfig(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
            await space.APIs.putAudio(this.spaceId, this.audioId, audioBlob);
        } catch (e) {
            await this.rollback();
            throw e;
        }
    }

    async rollback() {
        try {
            const documentModule = require('assistos').loadModule('document', this.securityContext);
            const paragraphConfig = await documentModule.getParagraphConfig(this.spaceId, this.documentId, this.paragraphId);
            delete paragraphConfig.audio;
            delete paragraphConfig.commands["speech"].taskId;
            await documentModule.updateParagraphConfig(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
            if(this.audioId){
                await space.APIs.deleteAudio(this.spaceId, this.audioId);
            }
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
            securityContext:  {...this.securityContext},
            name: this.constructor.name,
            configs: {
                documentId: this.documentId,
                paragraphId: this.paragraphId,
            }
        }
    }
}
module.exports = TextToSpeech;
