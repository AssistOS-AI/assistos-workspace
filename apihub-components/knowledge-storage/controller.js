const fsPromises = require('fs').promises;
const path = require('path');
function sendResponse(response,statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
async function saveJSON(response, spaceData, filePath) {
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch(error) {
        sendResponse(response, 500, "text/html", error+ ` Error at writing space: ${filePath}`);
        return false;
    }
    return true;
}
async function loadFilteredKnowledge(request, response){
    let queryParams = request.query.param1;
    let searchedWords = queryParams.split(" ");
    const filePath = `../data-volume/spaces/${request.params.spaceId}/agents/${request.params.agentId}/knowledge.json`;
    let knowledge =  JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    const regexPattern = new RegExp(searchedWords.join("|"), "gim"); // "i" flag for case-insensitive matching

    const filteredKnowledge = knowledge.agentIntent.filter((text) => {
        regexPattern.lastIndex = 0; // Reset lastIndex before each test
        return regexPattern.test(text);
    });
    sendResponse(response, 200, "text/html", JSON.stringify(filteredKnowledge));
}
async function addKnowledge(request, response){
    const filePath = `../data-volume/spaces/${request.params.spaceId}/agents/${request.params.agentId}/knowledge.json`;
    let jsonData = JSON.parse(request.body.toString());
    let knowledge =  JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    knowledge.push(jsonData);
    if(await saveJSON(response, JSON.stringify(knowledge), filePath)){
        sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
    }
}

async function loadKnowledge(request, response){
    const filePath = `../data-volume/spaces/${request.params.spaceId}/agents/${request.params.agentId}/knowledge.json`;
    let knowledge =  JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    sendResponse(response, 200, "text/html", JSON.stringify(knowledge));
}
async function storeKnowledge(request, response){
    const filePath = `../data-volume/spaces/${request.params.spaceId}/agents/${request.params.agentId}.json`;
    if(request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully agent: ${request.params.agentId}`);
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    if(await saveJSON(response, JSON.stringify(jsonData), filePath)){
        sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
    }
}

async function loadDefaultAgent(request,response) {
    const filePath=`../data-volume/default-agents/default-agent.json`;
    const jsonContent = await fsPromises.readFile(filePath, 'utf8');
    sendResponse(response, 200, "text/html", jsonContent);
}

module.exports = {
    loadKnowledge,
    loadFilteredKnowledge,
    addKnowledge,
    storeKnowledge,
    loadDefaultAgent
}