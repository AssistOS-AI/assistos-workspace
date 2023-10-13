async function initModels(request, response){

    let modelsName = ["GPT3Point5Turbo"];
    let registry = {};
    for(const name of modelsName){
        const model = require(`./models/${name}.js`);
        registry[name] = new model(request, response);
    }
    return registry;
}

function chooseModel(registry, settings){
    return registry["GPT3Point5Turbo"];
}
async function generateResponse(request, response) {

    let settings = JSON.parse(request.body.toString());
    let registry = await initModels(request, response);
    let model = chooseModel(registry,settings);
    await model.callLLM(settings.prompt);
}
module.exports = {
    generateResponse
}