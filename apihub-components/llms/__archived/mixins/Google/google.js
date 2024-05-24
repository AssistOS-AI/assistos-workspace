const {GoogleGenerativeAI} = require("@google/generative-ai");
const streamEmitter = require('../../utils/streamEmitter.js');

function createGoogleGenerativeAIInstance(apiKey) {
    if (!apiKey) {
        const error = new Error("API key not provided");
        error.statusCode = 400;
        throw error;
    }
    return new GoogleGenerativeAI(apiKey);
}

module.exports = function (modelInstance) {
    const GoogleGenerativeAI = createGoogleGenerativeAIInstance(modelInstance.apiKey);
    const model = GoogleGenerativeAI.getGenerativeModel({model: modelInstance.getModelName()});
    modelInstance.getResponse = async function (prompt, configs){
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}