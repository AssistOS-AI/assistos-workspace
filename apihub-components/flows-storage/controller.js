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
function getFlowName(fileName, separator = "#") {
    if (typeof fileName !== 'string') {
        throw new Error('fileName must be a string');
    }
    const separatorIndex = fileName.indexOf(separator);

    return fileName.substring(0, separatorIndex);
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
module.exports = {
    loadDefaultFlows,
    loadDefaultPersonalities,
    loadFlows
}