const constants = require("assistos").constants;
const htmlEntities = require('html-entities');
const Personality = require("../../assistos-sdk/modules/personality/models/Personality");
let flowModule = require("assistos").loadModule("flow", {});
function parseCommand(input) {
    input = htmlEntities.decode(input);
    for(let command of constants.TTS_COMMANDS){
        if(input.startsWith(command.NAME)){
            let [commandName, ...params] = input.split(' ');
            const paramsObject = {};
            for(let i = 0; i < command.PARAMETERS.length; i++){
                if(command.PARAMETERS[i].REQUIRED && !params[i]){
                    throw new Error(`Missing required parameter ${command.PARAMETERS[i].NAME}`);
                }
                if(command.PARAMETERS[i].VALUES && !command.PARAMETERS[i].VALUES.includes(params[i])){
                    throw new Error(`Invalid value for parameter ${command.PARAMETERS[i].NAME}`);
                }
                if(command.PARAMETERS[i].MIN_VALUE && params[i] < command.PARAMETERS[i].MIN_VALUE){
                    throw new Error(`Value for parameter ${command.PARAMETERS[i].NAME} is too low`);
                }
                if(command.PARAMETERS[i].MAX_VALUE && params[i] > command.PARAMETERS[i].MAX_VALUE){
                    throw new Error(`Value for parameter ${command.PARAMETERS[i].NAME} is too high`);
                }
                paramsObject[command.PARAMETERS[i].NAME] = params[i];
            }
            return {
                executeFn: command.EXECUTE_FN,
                paramsObject: paramsObject
            };
        }
    }
}
async function textToSpeech(spaceId, configs, targetParagraph){
    if(!targetParagraph){
        return;
    }
    const personalityModule = require("assistos").loadModule("personality", {});
    let personalityData = await personalityModule.getPersonality(this.id, id);
     new Personality(personalityData);
    let personality = await getPersonality(configs.personalityName);
    let audio = (await flowModule.callFlow("TextToSpeech", {
        spaceId: spaceId,
        prompt: prompt,
        voiceId: personality.voiceId,
        voiceConfigs: {
            emotion: configs.emotion,
            styleGuidance: configs.styleGuidance,
            voiceGuidance: configs.voiceGuidance,
            temperature: configs.temperature
        },
        modelName: "PlayHT2.0"
    })).data;
}
module.exports = {
    parseCommand
};