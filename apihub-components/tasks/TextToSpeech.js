const Task = require('./Task');
const crypto = require("../apihub-component-utils/crypto");
const space = require("../spaces-storage/space");
const constants = require('./constants');
class TextToSpeech extends Task {
    constructor(securityContext, spaceId, userId, config) {
        super(securityContext, spaceId, userId);
        this.documentId = config.documentId;
        this.paragraphId = config.paragraphId;
        this.ttsCommand = config.ttsCommand;
        this.prompt = config.prompt;
    }
    async runTask() {
        try{
            await this.textToSpeech();
        } catch (e) {
            //prevent the task from being marked as failed
            if(e.message !== constants.STATUS.CANCELLED){
                throw e;
            }
        }
    }
    textToSpeech() {
        return new Promise(async (resolve, reject) => {
            this.reject = reject;
            const llmModule = require('assistos').loadModule('llm', this.securityContext);
            const documentModule = require('assistos').loadModule('document', this.securityContext);
            const personalityModule = require('assistos').loadModule('personality', this.securityContext);
            const voiceId = (await personalityModule.getPersonalityByName(this.spaceId, this.ttsCommand.paramsObject.personality)).voiceId;
            const audioBlob = await llmModule.textToSpeech(this.spaceId, {
                prompt: this.prompt,
                voice: voiceId,
                emotion: this.ttsCommand.paramsObject.emotion,
                styleGuidance: this.ttsCommand.paramsObject.styleGuidance,
                voiceGuidance: this.ttsCommand.paramsObject.voiceGuidance,
                temperature: this.ttsCommand.paramsObject.temperature,
                modelName: "PlayHT2.0"
            });
            this.audioId = crypto.generateId();
            const paragraphConfig = await documentModule.getParagraphConfig(this.spaceId, this.documentId, this.paragraphId);
            paragraphConfig.audio = {
                id: this.audioId,
                src: `spaces/audio/${this.spaceId}/${this.audioId}`
            }
            await space.APIs.putAudio(this.spaceId, this.audioId, audioBlob);
            await documentModule.updateParagraphConfig(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
            resolve();
        });
    }
    async cancelTask() {
        this.reject(constants.STATUS.CANCELLED);
        delete this.reject;
        try {
            const documentModule = require('assistos').loadModule('document', this.securityContext);
            const paragraphConfig = await documentModule.getParagraphConfig(this.spaceId, this.documentId, this.paragraphId);
            delete paragraphConfig.audio;
            await documentModule.updateParagraphConfig(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
            if(this.audioId){
                await space.APIs.deleteAudio(this.spaceId, this.audioId);
            }
        } catch (e){
            //no audio to delete
        }
    }

    serialize() {
        return JSON.stringify({
            status: this.status,
            id: this.id,
            securityContext: this.securityContext,
            name: this.constructor.name,
            config: this.config
        })
    }
}
module.exports = TextToSpeech;