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
async function loadAgent(request, response){
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/agents/${request.params.agentId}.json`;
    let agent =  JSON.parse(await fsPromises.readFile(filePath, 'utf8'));
    sendResponse(response, 200, "text/html", JSON.stringify(agent.tasks));
}
async function storeAgent(request, response){
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/agents/${request.params.agentId}.json`;
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

module.exports = {
    loadAgent,
    storeAgent
}