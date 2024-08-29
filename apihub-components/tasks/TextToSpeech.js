const Task = require('./Task');
const crypto = require("../apihub-component-utils/crypto");
const space = require("../spaces-storage/space");
const constants = require('./constants');
const {storeRequiredEnvironmentVariables} = require("../../opendsu-sdk/psknode/tests/util/ApiHubTestNodeLauncher/launcher-utils");
class TextToSpeech extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.documentId = configs.documentId;
        this.paragraphId = configs.paragraphId;
        this.ttsCommand = configs.ttsCommand;
        this.prompt = configs.prompt;
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
    async textToSpeech() {
        return new Promise(async (resolve, reject) => {
            this.reject = reject;
            try {
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
                delete paragraphConfig.commands["speech"].taskId;
                await space.APIs.putAudio(this.spaceId, this.audioId, audioBlob);
                await documentModule.updateParagraphConfig(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
                resolve();
            } catch (e) {
                await this.rollback();
                reject(e);
            }
        });
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
        this.reject(constants.STATUS.CANCELLED);
        delete this.reject;
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
module.exports = TextToSpeech;