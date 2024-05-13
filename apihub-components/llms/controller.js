const utils = require('../apihub-component-utils/utils.js');
const LLMFactory= require('./factory/LLMFactory.js');
const space=require('../spaces-storage/space.js');
async function generateText(request, response) {
    const {modelName, prompt, messagesQueue, configs} = request.body;
    const spaceId=request.params.spaceId;
    if(!prompt){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Prompt is required"
        });
    }
    const apiKey= await space.APIs.getAPIKey(spaceId,modelName)
    const modelInstance = LLMFactory.createLLM(modelName,{},apiKey,);
}

module.exports = {
    generateText
}