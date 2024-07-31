const constants = require("assistos").constants;
const htmlEntities = require('html-entities');

function parseCommand(input) {
    input = htmlEntities.decode(input);
    for (let command of constants.TTS_COMMANDS) {
        if (input.startsWith(command.NAME)) {
            let [foundCommand, remainingText] = input.split(":");
            let [commandName, ...params] = foundCommand.trim().split(/\s+/);
            const paramsObject = {};
            for (let param of params) {
                if (param.includes('=')) {
                    let [name, value] = param.split('=');
                    let parameter = command.PARAMETERS.find(p => p.NAME === name);
                    if (!parameter) {
                        continue;
                    }
                    paramsObject[name] = value;
                }
            }
            return {
                executeFn: command.EXECUTE_FN,
                paramsObject: paramsObject,
                remainingText: remainingText
            };
        }
    }
}

async function textToSpeech(spaceId, configs, text, task) {
    let flowModule = require("assistos").loadModule("flow", task.securityContext);
    const personalityModule = require("assistos").loadModule("personality", task.securityContext);
    if (!text) {
        return;
    }
    let personalityData = await personalityModule.getPersonalityByName(spaceId, configs.personality);
    let personality = new personalityModule.models.personality(personalityData);
    if(!personality.voiceId){
        throw new Error(`Personality ${personality.name} does not have a voice`);
    }
    let audio = (await flowModule.callFlow(spaceId, "TextToSpeech", {
        prompt: text,
        voiceId: personality.voiceId,
        voiceConfigs: {
            emotion: configs.emotion,
            styleGuidance: configs.styleGuidance,
            voiceGuidance: configs.voiceGuidance,
            temperature: configs.temperature
        },
        modelName: "PlayHT2.0"
    })).data;
    return {
        audio: audio,
        personality: personality
    };
}

async function executeCommandOnParagraph(spaceId, documentId, chapterId, paragraph, commandObject, task) {
    if (commandObject.executeFn === "textToSpeech") {
        const documentModule = require("assistos").loadModule("document", task.securityContext);
        const spaceModule = require("assistos").loadModule("space", task.securityContext);

        try {
            let{audioBlob, personality} = await textToSpeech(spaceId, commandObject.paramsObject, commandObject.remainingText, task);
            let audioId = await spaceModule.addAudio(spaceId, audioBlob.toString("base64"));
            let audioSrc = `spaces/audio/${spaceId}/${audioId}`;
            let audioConfigs = {
                personalityId: personality.id,
                voiceId: personality.voiceId,
                emotion: commandObject.emotion,
                styleGuidance: commandObject.styleGuidance,
                voiceGuidance: commandObject.voiceGuidance,
                temperature: commandObject.temperature,
                id: audioId,
                src: audioSrc,
                prompt: paragraph.text
            }
            await documentModule.updateParagraphAudio(assistOS.space.id, this._document.id, this.paragraphId, audioConfigs);
        } catch (e) {
            throw new Error(`Text to speech failed: ${e}`);
        }

    }

}

module.exports = {
    parseCommand,
    executeCommandOnParagraph
};