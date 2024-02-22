function sendResponse(response, statusCode, contentType, message) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}

async function initModels() {

    let modelsName = ["GPT3Point5Turbo", "GPT4"];
    let registry = {};
    for (const name of modelsName) {
        const model = require(`./models/${name}.js`);
        registry[name] = new model();
    }
    return registry;
}

//cost -> intelligence -> creativity -> context
// with weights
function computeOverallScore(object, weights) {
    if (!object.context) {
        object.context = 4000;
    }
    object.context = object.context / 10000;
    return ((object.intelligence * weights.intelligence +
        object.creativity * weights.creativity +
        object.context * weights.context) - object.cost * weights.cost);
}

function chooseModel(registry, settings) {
    let weights = {
        cost: 0.35,
        intelligence: 0.35,
        creativity: 0.2,
        context: 0.1
    }
    let requestScore = computeOverallScore(settings, weights);
    let bestModel = {modelName: "", difference: 10};
    for (let modelName of Object.keys(registry)) {
        let difference = Math.abs(computeOverallScore(registry[modelName], weights) - requestScore);
        if (difference < bestModel.difference) {
            bestModel.modelName = registry[modelName].name;
            bestModel.difference = difference;
        }
    }

    return registry[bestModel.modelName];
}

async function generateResponse(request, response) {

    let settings = JSON.parse(request.body.toString());
    let registry = await initModels(response);
    let model = chooseModel(registry, settings);
    try {
        let result = await model.callLLM(settings);
        sendResponse(response, 200, "text/html", result);
    } catch (e) {
        console.error(e);
        sendResponse(response, 500, "text/html", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    }
}

async function getFlowFromSpace(spaceId,flowId){

}
async function executeFlow(request, response) {
    const {spaceId, applicationId, flowId} = request.params;
    let flowSettings = JSON.parse(request.body.toString());
    const llmModels = await initModels();
    const flow= applicationId
        ? require(`../../apihub-root/spaces/${spaceId}/${applicationId}/${flowId}`)
        : require(`../../apihub-root/spaces/${spaceId}/${flowId}`)

}

module.exports = {
    generateResponse,
    executeFlow
}