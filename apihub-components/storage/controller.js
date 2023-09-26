/*
spaces is root folder
/{spaceId}/name
/{spaceId}/documents/{documentId}
/{spaceId}/documents/{documentId}/title
/{spaceId}/documents/{documentId}/abstract
/{spaceId}/documents/{documentId}/chapters/{chapterId}
/{spaceId}/documents/{documentId}/chapters/{chapterId}/title
/{spaceId}/documents/{documentId}/chapters/{chapterId}/paragraphs/{paragraphId}
/{spaceId}/documents/{documentId}/settings
/{spaceId}/settings/llms/{llmId}
/{spaceId}/settings/personalities/{personalityId}
/{spaceId}/admins/{adminId}
/{spaceId}/announcements/{announcementId}
/{spaceId}/users/{userId}*/
const fs = require('fs');

function saveJSON(response, spaceData, filePath) {
    try {
        fs.writeFileSync(filePath, spaceData, 'utf8');
    } catch(error) {
        sendResponse(response, 500, "text/html", error+ ` Error at writing space: ${filePath}`);
        return "";
    }
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
        data = require(filePath);
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return "";
    }
    sendResponse(response, 200, "text/html", JSON.stringify(data));
    return "";
}

async function storeObject(request, response) {
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
    let jsonData = JSON.parse(request.body.toString());
    if(jsonData === "") {
        fs.unlinkSync(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.objectName}`);
        return "";
    }
    saveJSON(response, JSON.stringify(jsonData), filePath);
    sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
    return "";
}

function createFolder(spaceId, data, folderName) {
    if(data) {
        let folderPath = `../apihub-root/spaces/${spaceId}/${folderName}`;
        fs.mkdirSync(folderPath);
        if(folderName !== "status") {
            for(let item of data) {
                saveJSON(null, JSON.stringify(item), `${folderPath}/${item.id}.json`);
            }
        }
        else {
            saveJSON(null, JSON.stringify(data), `${folderPath}/${folderName}.json`);
        }
    }
}

async function storeSpace(request, response) {
    const folderPath = `../apihub-root/spaces/${request.params.spaceId}`;
    try {
        if(!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
            let jsonData = JSON.parse(request.body.toString());
            createFolder(request.params.spaceId, jsonData.documents, "documents");
            createFolder(request.params.spaceId, jsonData.users, "users");
            createFolder(request.params.spaceId, jsonData.scripts, "scripts");
            delete jsonData.documents;
            delete jsonData.scripts;
            delete jsonData.users;
            createFolder(request.params.spaceId, jsonData, "status");
            sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
            return "";
        }
    } catch (err) {
        console.error(err);
    }
}

async function buildSpaceRecursive(filePath) {
    let localData = [];
    for (let item of fs.readdirSync(filePath)) {
        const stat = await fs.promises.stat(`${filePath}/${item}`);
        if(stat.isDirectory()) {
            localData.push({item: await buildSpaceRecursive(`${filePath}/${item}`)});
        }
        else {
            let result = require(`${filePath}/${item}`);
            localData.push(result);
        }
    }
    return localData;
}

async function loadSpace(request, response){
    let spaceId = request.params.spaceId;
    let filePath = `../apihub-root/spaces/${spaceId}`;
    let statusJson = require(`${filePath}/status/status.json`);

    for(let item of fs.readdirSync(filePath)) {
        if(item !== "status") {
            let spaceData = await buildSpaceRecursive(`${filePath}\/${item}`);
            statusJson[item] = spaceData;
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