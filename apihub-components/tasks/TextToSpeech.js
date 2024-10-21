const Task = require('./Task');
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
const ffmpeg = require('../apihub-component-utils/ffmpeg');
const Storage = require('../apihub-component-utils/storage');
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
            const spaceModule = require('assistos').loadModule('space', this.securityContext);
            const personalityModule = require('assistos').loadModule('personality', this.securityContext);
            const utilModule = require('assistos').loadModule('util', this.securityContext);
            const paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
            await utilModule.constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").VALIDATE(this.spaceId, paragraph, this.securityContext);

            const paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
            const personalityData = await personalityModule.getPersonalityByName(this.spaceId, paragraphCommands.speech.personality);

            const arrayBuffer = await llmModule.textToSpeech(this.spaceId, {
                prompt: utilModule.unsanitize(paragraph.text),
                voice: personalityData.voiceId,
                emotion: paragraphCommands.speech.emotion,
                styleGuidance: paragraphCommands.speech.styleGuidance,
                modelName: "PlayHT2.0"
            });
            const audioBuffer = Buffer.from(arrayBuffer);
            let audioDuration = await ffmpeg.getAudioDuration(audioBuffer);
            delete paragraphCommands.speech.taskId;
            this.audioId = await spaceModule.putAudio(audioBuffer);
            paragraphCommands.audio = {
                id: this.audioId,
                duration: audioDuration
            };
            await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraphCommands);
            this.emit(EVENTS.DEPENDENCY_COMPLETED);
        } catch (e) {
            await this.rollback();
            throw e;
        }
    }

    async rollback() {
        try {
            const documentModule = require('assistos').loadModule('document', this.securityContext);
            const paragraphConfig = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
            delete paragraphConfig.audio;
            delete paragraphConfig.speech.taskId;
            await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraphConfig);
            if (this.audioId) {
                await Storage.deleteFile(Storage.fileTypes.audios, this.audioId);
            }
        } catch (e) {
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
            securityContext: {...this.securityContext},
            name: this.constructor.name,
            configs: {
                documentId: this.documentId,
                paragraphId: this.paragraphId,
            }
        }
    }
    async getRelevantInfo() {
        const documentModule = require('assistos').loadModule('document', this.securityContext);
        let paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
        let info = {
            paragraphId: paragraph.id,
            text: paragraph.text
        }
        if(this.status === STATUS.FAILED){
            info.failMessage = this.failMessage;
        }
        return info;
    }
}

module.exports = TextToSpeech;
