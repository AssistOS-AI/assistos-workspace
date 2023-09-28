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
const fsPromises = require('fs').promises;
async function saveJSON(response, spaceData, filePath) {
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
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
        data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return "";
    }
    sendResponse(response, 200, "text/html", data);
    return "";
}

async function storeObject(request, response) {
    if(request.params.objectType === "status") {
        const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectType}.json`;
        let data;
        try {
            data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
            data = JSON.parse(data);
        } catch (error) {
            sendResponse(response, 404, "text/html", error+ ` Error file not found: ${filePath}`);
            return "";
        }
        let jsonData = JSON.parse(request.body.toString());
        let currentObject = data;
        let propertyNames = request.params.objectName.split('.');
        for (let propertyName of propertyNames) {
            if (currentObject.hasOwnProperty(propertyName)) {
                currentObject = currentObject[propertyName];
            } else {
                currentObject = undefined;
                break;
            }
        }
        if(currentObject) {
            let index = currentObject.findIndex((item) => item.id === jsonData.id);
            if(index > 0) {
                currentObject[index] = jsonData;
            }
            else {
                currentObject.push(jsonData);
            }
        }
        await saveJSON(response, JSON.stringify(data), filePath);
        sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
        return "";
    } else {
        const filePath = `../apihub-root/spaces/${request.params.spaceId}/${request.params.objectType}/${request.params.objectName}.json`;
        if(request.body.toString() === "") {
            await fsPromises.unlink(filePath);
            sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.objectName}`);
            return "";
        }
        let jsonData = JSON.parse(request.body.toString());
        await saveJSON(response, JSON.stringify(jsonData), filePath);
        sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
        return "";
    }
}

async function createFolder(spaceId, data, folderName) {
    if(data) {
        let folderPath = `../apihub-root/spaces/${spaceId}/${folderName}`;
        await fsPromises.mkdir(folderPath);
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
        if(!await fsPromises.exists(folderPath)) {
            await fsPromises.mkdir(folderPath);
            let jsonData = JSON.parse(request.body.toString());
            await createFolder(request.params.spaceId, jsonData.documents, "documents");
            await createFolder(request.params.spaceId, jsonData.users, "users");
            await createFolder(request.params.spaceId, jsonData.scripts, "scripts");
            delete jsonData.documents;
            delete jsonData.scripts;
            delete jsonData.users;
            await createFolder(request.params.spaceId, jsonData, "status");
            sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
            return "";
        }
    } catch (err) {
        console.error(err);
    }
}

async function buildSpaceRecursive(filePath) {
    let localData = [];
    for (let item of await fsPromises.readdir(filePath)) {
        const stat = await fsPromises.stat(`${filePath}/${item}`);
        if(stat.isDirectory()) {
            let obj={};
            obj[item] = await buildSpaceRecursive(`${filePath}/${item}`);
            localData.push(obj);
        }
        else {
            let result = await fsPromises.readFile(`${filePath}/${item}`);
            localData.push(JSON.parse(result));
        }
    }
    return localData;
}

async function loadSpace(request, response){
    let spaceId = request.params.spaceId;
    let filePath = `../apihub-root/spaces/${spaceId}`;
    let statusJson = await fsPromises.readFile(`${filePath}/status/status.json`);
    statusJson = JSON.parse(statusJson);
    for(let item of await fsPromises.readdir(filePath)) {
        if(item !== "status") {
            statusJson[item] = await buildSpaceRecursive(`${filePath}\/${item}`);
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