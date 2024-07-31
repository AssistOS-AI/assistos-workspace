const constants = require("assistos").constants;
const htmlEntities = require('html-entities');
const dataUtils = require("./data.js");
function findCommand(input) {
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
                action: command.ACTION,
                paramsObject: paramsObject,
                remainingText: remainingText
            };
        }
    }
    return null;
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
    let audioBlob = (await flowModule.callFlow(spaceId, "TextToSpeech", {
        spaceId: spaceId,
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
        audioBlob: audioBlob,
        personality: personality
    };
}

async function executeTextToSpeechOnParagraph(spaceId, documentId, paragraph, commandObject, task) {
    const documentModule = require("assistos").loadModule("document", task.securityContext);
    const spaceModule = require("assistos").loadModule("space", task.securityContext);
    try {
        let{audioBlob, personality} = await textToSpeech(spaceId, commandObject.paramsObject, commandObject.remainingText, task);
        const base64String = await dataUtils.blobToBase64(audioBlob);
        let audioId = await spaceModule.addAudio(spaceId, base64String);
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
        await documentModule.updateParagraphAudio(spaceId, documentId, paragraph.id, audioConfigs);
        return audioId;
    } catch (e) {
        throw new Error(`Text to speech failed: ${e}`);
    }
}

module.exports = {
    findCommand,
    executeTextToSpeechOnParagraph
};