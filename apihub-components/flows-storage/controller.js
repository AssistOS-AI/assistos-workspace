const fsPromises = require('fs').promises;
const path = require('path');
function sendResponse(response, statusCode, contentType, message) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}

async function getDefaultItems(filePath) {
    let localData = [];
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return {file, stat};
    });
    const fileStats = await Promise.all(statPromises);
    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
    for (const {file} of fileStats) {
        const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
        localData.push(JSON.parse(jsonContent));
    }
    return localData;
}
async function loadDefaultPersonalities(request, response) {
    const filePath = `../apihub-root/default-personalities`;
    let data = await getDefaultItems(filePath);
    sendResponse(response, 200, "text/html", JSON.stringify(data));
}
async function loadObjects(filePath){
    let localData = "";
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return { file, stat };
    }).filter(stat => stat.file !== ".git");
    let fileStats = await Promise.all(statPromises);
    fileStats = fileStats.filter(stat => stat.file !== ".git");
    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
    for (const { file } of fileStats) {
        localData += await fsPromises.readFile(path.join(filePath, file), 'utf8') + '\n';
    }
    return localData;
}
async function loadDefaultFlows(request, response) {
    const filePath = `../apihub-root/default-flows`;
    let flows = await loadObjects(filePath);
    return sendResponse(response, 200, "application/javascript", flows);
}
async function loadFlows(request, response){
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/flows`;
    let flows = await loadObjects(filePath);
    return sendResponse(response, 200, "application/javascript", flows);
}
async function storeFlow(request, response){
    let objectId = decodeURIComponent(request.params.objectId);
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/flows/${objectId}.js`;
    if(request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${objectId}`);
        return;
    }
    let data = request.body.toString();
    try {
        await fsPromises.writeFile(filePath, data, 'utf8');
    } catch(error) {
        return sendResponse(response, 500, "text/html", error+ ` Error at writing file: ${filePath}`);
    }
    return sendResponse(response, 200, "text/html", `Success, write ${objectId}`);
}
async function storeFlows(request, response){
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/flows`;
    try{
        await fsPromises.access(filePath);
    }catch (e){
        /* the error is that the folder doesn't exist, it needs to be created*/
        await fsPromises.mkdir(filePath);
    }

    let flows = JSON.parse(request.body.toString());
    for (const flow of flows) {
        try {
            await fsPromises.writeFile(filePath+`/${flow.name}.js`, flow.class, 'utf8');
        }
        catch (e){
            return sendResponse(response, 500, "text/html", e);
        }
    }
    return sendResponse(response, 200, "text/html", `Success, Write flows to space: ${request.params.spaceId}`);
}
async function storeAppFlow(request, response){
    let objectId = decodeURIComponent(request.params.objectId);
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/applications/${request.params.applicationId}/flows/${objectId}.js`;
    if(request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${objectId}`);
        return;
    }
    let data = request.body.toString();
    try {
        await fsPromises.writeFile(filePath, data, 'utf8');
    } catch(error) {
        return sendResponse(response, 500, "text/html", error+ ` Error at writing file: ${filePath}`);
    }
    return sendResponse(response, 200, "text/html", `Success, write ${objectId}`);
}
async function loadAppFlows(request, response){
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/applications/${request.params.applicationId}/flows`;
    let flows = await loadObjects(filePath);
    return sendResponse(response, 200, "application/javascript", flows);
}
module.exports = {
    loadDefaultFlows,
    loadDefaultPersonalities,
    loadFlows,
    storeFlow,
    storeFlows,
    storeAppFlow,
    loadAppFlows
}