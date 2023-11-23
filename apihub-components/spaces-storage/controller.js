const fs = require('fs');
const path = require('path');
const fsPromises = require('fs').promises;
async function saveJSON(response, spaceData, filePath) {
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch(error) {
        sendResponse(response, 500, "text/html", error+ ` Error at writing space: ${filePath}`);
        return false;
    }
    return true;
}

function sendResponse(response,statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}

async function loadObject(request, response) {
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
    let data;
    try {
        data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return "";
    }
    sendResponse(response, 200, "text/html", data);
    return "";
}

async function storeObject(request, response) {
        const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
        if(request.body.toString() === "") {
            await fsPromises.unlink(filePath);
            sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.objectName}`);
            return;
        }
        let jsonData = JSON.parse(request.body.toString());
        if(await saveJSON(response, JSON.stringify(jsonData), filePath)){
            sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
        }
}

async function storeFolder(spaceId, data, folderName) {
    if(data) {
        let folderPath = `../apihub-root/spaces/${spaceId}/${folderName}`;
        try{
            await fsPromises.access(folderPath);
        }catch (e){
            /* the error is that the folder doesn't exist, it needs to be created*/
            await fsPromises.mkdir(folderPath);
        }

        if(folderName !== "status") {
            for(let item of data) {
                await saveJSON(null, JSON.stringify(item), `${folderPath}/${item.id}.json`);
            }
        }
        else {
            await saveJSON(null, JSON.stringify(data), `${folderPath}/${folderName}.json`);
        }
    }
}

async function storeSpace(request, response) {
    const folderPath = `../apihub-root/spaces/${request.params.spaceId}`;
    try {
        await fsPromises.access(folderPath);
    } catch (err) {
        /* the error is that the folder doesn't exist, it needs to be created*/
        await fsPromises.mkdir(folderPath);
    }
    if (request.body.toString().trim() === "") {
        try {
            if (fsPromises.rm) {
                await fsPromises.rm(folderPath, { recursive: true, force: true });
            }
            else if (fsPromises.rmdir) {
                await fsPromises.rmdir(folderPath, { recursive: true });
            }
        } catch (err) {
            sendResponse(response, 500, "text/html", "Error deleting the folder");
            return;
        }
        sendResponse(response, 200, "text/html", "Space deleted successfully");
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    await storeFolder(request.params.spaceId, jsonData.documents, "documents");
    await storeFolder(request.params.spaceId, jsonData.personalities, "personalities");
    await storeFolder(request.params.spaceId, jsonData.flows, "flows");
    delete jsonData.personalities
    delete jsonData.documents;
    delete jsonData.flows;
    await storeFolder(request.params.spaceId, jsonData, "status");
    sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
    return "";
}

async function buildSpace(filePath) {
    let localData = [];
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return { file, stat };
    });
    const fileStats = await Promise.all(statPromises);
    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
    for (const { file } of fileStats) {
        const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
        localData.push(JSON.parse(jsonContent));
    }
    return localData;
}

async function loadSpace(request, response){
    let spaceId = request.params.spaceId;
    let filePath = `../apihub-root/spaces/${spaceId}`;
    let statusJson
    try{
        statusJson = await fsPromises.readFile(`${filePath}/status/status.json`);
        statusJson = JSON.parse(statusJson);
    }catch (e){
        sendResponse(response, 404, "text/html", e+ ` Error space not found: ${filePath}`);
        return;
    }
    for(let item of await fsPromises.readdir(filePath)) {
        if(item !== "status" && item!== "agents"){
            statusJson[item] = await buildSpace(`${filePath}\/${item}`);
        }
    }
    sendResponse(response, 200, "text/html", JSON.stringify(statusJson));
}

module.exports = {
    loadObject,
    storeObject,
    loadSpace,
    storeSpace
}