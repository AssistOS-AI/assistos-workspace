 function sendResponse(response, statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
async function initModels(){

    let modelsName = ["GPT3Point5Turbo", "GPT4"];
    let registry = {};
    for(const name of modelsName){
        const model = require(`./models/${name}.js`);
        registry[name] = new model();
    }
    return registry;
}
//cost -> intelligence -> creativity -> max_tokens
 // with weights
function computeOverallScore(object, weights){
    if(!object.max_tokens){
        object.max_tokens = 0.4;
    }
    return ((object.intelligence*weights.intelligence +
        object.creativity*weights.creativity +
        object.max_tokens*weights.max_tokens) - object.cost*weights.cost);
}

function chooseModel(registry, settings){
    let weights = {
        cost: 0.35,
        intelligence: 0.35,
        creativity: 0.2,
        max_tokens: 0.1
    }
    let requestScore = computeOverallScore(settings, weights);
    let bestModel = {modelName:"", similarity:10};
    for (let modelName of Object.keys(registry)){
        let similarity = Math.abs(computeOverallScore(registry[modelName], weights) - requestScore);
        if(similarity < bestModel.similarity){
            bestModel.modelName = registry[modelName].name;
            bestModel.similarity = similarity;
        }
    }

    return registry[bestModel.modelName];
}

async function generateResponse(request, response) {

    let settings = JSON.parse(request.body.toString());
    let registry = await initModels(response);
    let model = chooseModel(registry,settings);
    try{
        let result = await model.callLLM(settings.prompt);
        sendResponse(response, 200, "text/html", result);
    }catch (e){
        console.error(e);
        sendResponse(response, 500, "text/html", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    }
}
module.exports = {
    generateResponse
}