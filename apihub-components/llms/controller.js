 function sendResponse(response, statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
async function initModels(){

    let modelsName = ["GPT3Point5Turbo"];
    let registry = {};
    for(const name of modelsName){
        const model = require(`./models/${name}.js`);
        registry[name] = new model();
    }
    return registry;
}
//cost -> intelligence -> creativity -> max_tokens
 //with weights
function chooseModel(registry, settings){
    return registry["GPT3Point5Turbo"];
}
async function generateResponse(request, response) {

    let settings = JSON.parse(request.body.toString());
    let registry = await initModels(response);
    let model = chooseModel(registry,settings);
    try{
        let result = await model.callLLM(settings.prompt);
        sendResponse(response, 200, "text/html", result);
    }catch (e){
        sendResponse(response, 500, "text/html", JSON.stringify(e, Object.getOwnPropertyNames(e)));
    }
}
module.exports = {
    generateResponse
}