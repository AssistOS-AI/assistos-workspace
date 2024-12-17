const Task = require('./Task');
const constants = require('./constants');
const STATUS = constants.STATUS;
const EVENTS = constants.EVENTS;
const ffmpeg = require('../apihub-component-utils/ffmpeg');
const Storage = require('../apihub-component-utils/storage');
class TextToSpeech extends Task {
    constructor(spaceId, userId, configs) {
        super(spaceId, userId);
        this.documentId = configs.documentId;
        this.paragraphId = configs.paragraphId;
    }

    async runTask() {
        try {
            const llmModule = await this.loadModule('llm');
            const documentModule = await this.loadModule('document');
            const spaceModule = await this.loadModule('space');
            const personalityModule = await this.loadModule('personality');
            const utilModule = await this.loadModule('util');
            const constants = require("assistos").constants;
            const paragraph = await documentModule.getParagraph(this.spaceId, this.documentId, this.paragraphId);
            paragraph.commands["speech"].personality = utilModule.unsanitize(paragraph.commands["speech"].personality);
            await constants.COMMANDS_CONFIG.COMMANDS.find(command => command.NAME === "speech").VALIDATE(this.spaceId, paragraph, this.securityContext);

            const paragraphCommands = await documentModule.getParagraphCommands(this.spaceId, this.documentId, this.paragraphId);
            const personalityData = await personalityModule.getPersonalityByName(this.spaceId, utilModule.unsanitize(paragraphCommands.speech.personality));

            const arrayBuffer = await llmModule.textToSpeech(this.spaceId, {
                prompt: utilModule.unsanitize(paragraph.text),
                voice: personalityData.voiceId,
                emotion: paragraphCommands.speech.emotion,
                styleGuidance: paragraphCommands.speech.styleGuidance,
                modelName: "PlayHT2.0"
            });
            const audioBuffer = Buffer.from(arrayBuffer);
            let audioDuration = await ffmpeg.getAudioDurationFromBuffer(audioBuffer);
            delete paragraphCommands.speech.taskId;
            this.audioId = await spaceModule.putAudio(audioBuffer);
            paragraphCommands.audio = {
                id: this.audioId,
                duration: audioDuration,
                volume: 100
            };
            if(paragraphCommands.compileVideo){
                delete paragraphCommands.compileVideo;
            }
            await documentModule.updateParagraphCommands(this.spaceId, this.documentId, this.paragraphId, paragraphCommands);
            this.emit(EVENTS.DEPENDENCY_COMPLETED);
        } catch (e) {
            await this.rollback();
            throw e;
        }
    }

    async rollback() {
        try {
            const documentModule = await this.loadModule('document');
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
            name: this.constructor.name,
            failMessage: this.failMessage,
            configs: {
                documentId: this.documentId,
                paragraphId: this.paragraphId,
                sourceCommand: "speech"
            }
        }
    }
    async getRelevantInfo() {
        let info = {}
        if(this.status === STATUS.FAILED){
            info.failMessage = this.failMessage;
        }
        return info;
    }
}

module.exports = TextToSpeech;
