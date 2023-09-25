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

function saveJSON(response, spaceData, filePath){
    try {
        fs.writeFileSync(filePath, JSON.stringify(spaceData, null, 2), 'utf8');
    }catch(error){
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
async function loadSpace(request, response){
    const filePath = `../apihub-root/spaces/${request.params.spaceId}/status.json`;
    let spaceData;
    try {
        spaceData = require(filePath);
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return "";
    }

    sendResponse(response, 200, "text/html", JSON.stringify(spaceData));
    return "";
}
async function loadObject(request, response) {
    const path = request.params.filePath.replaceAll(":","/");

    const filePath = `../apihub-root/spaces/${path}.json`;
    const objectPath = request.params.objectPath;
    let spaceData;
    try {
      spaceData = require(filePath);
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return "";
    }

    if(objectPath === ""){
        sendResponse(response, 200, "text/html", JSON.stringify(spaceData));
        return "";
    }

    const pathParts = objectPath.split(':');
    let currentObject = spaceData;

    for (let part of pathParts) {
        if (part in currentObject) {
            currentObject = currentObject[part];
        } else if (Array.isArray(currentObject)) {
            const index = parseInt(part, 10);
            if (index < currentObject.length && index >= 0) {
                currentObject = currentObject[index];
            } else {
                sendResponse(response, 422, "text/html", ` Error space found, but failed to find the object at: ${objectPath}`);
                return "";
            }
        } else {
            sendResponse(response, 422, "text/html", ` Error space found, but failed to find the object at: ${objectPath}`);
            return "";
        }
    }
    sendResponse(response, 200, "text/html", JSON.stringify(currentObject));
    return "";
}

function deleteObject(request, response){

    const path = request.params.filePath.replaceAll(":","/");
    const filePath = `../apihub-root/spaces/${path}.json`;

    if(request.params.objectPath===""){
        try {
            fs.unlinkSync(filePath);
        }catch (e){
            sendResponse(response, 500, "text/html", e + `Error deleting file at: ${filePath}`);
            return "";
        }
        sendResponse(response, 200, "text/html", `Success deleting file at ${filePath}`);
        return "";
    }

    const objectPath = request.params.objectPath;
    let spaceData;
    try {
        spaceData = require(filePath);
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return;
    }
    const pathParts = objectPath.split(':');
    let currentObject = spaceData;
    let parentObject = null;
    let parentKey = null;

    for (let i=0;i<pathParts.length;i++) {
        /* not last iteration */
        if(i!==(pathParts.length-1)){
            if (pathParts[i] in currentObject) {
                parentKey = pathParts[i];
                currentObject = currentObject[pathParts[i]];
                parentObject = currentObject;
            }else{
                sendResponse(response, 422, "text/html", ` Error space found, but failed to find the object at: ${objectPath}`);
                return "";
            }
            /* last iteration */
        }else{
            if(currentObject[pathParts[i]]){
                delete currentObject[pathParts[i]];
                saveJSON(response,spaceData,filePath);

                sendResponse(response, 200, "text/html", `Success, ${request.params.objectPath}`);
                return "";
            }else{
                sendResponse(response, 404, "text/html", ` Error space found, but failed to find the object at: ${objectPath}`);
                return "";
            }
        }
    }
}

function putObject(request,response){
    const path = request.params.filePath.replaceAll(":","/");
    let jsonData = JSON.parse(request.body.toString());

    const filePath = `../apihub-root/spaces/${path}.json`;
    const objectPath = request.params.objectPath;
    let spaceData;
    if(request.params.objectPath === "")
    {
        saveJSON(response,JSON.parse(request.body.toString()),filePath);
        sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
        return;
    }

    try {
        spaceData = require(filePath);
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error space not found: ${filePath}`);
        return "";
    }
    const pathParts = objectPath.split(':');
    let currentObject = spaceData;
    let parentObject = null;
    let parentKey = null;

    for (let i=0;i<pathParts.length;i++) {
        /* not last iteration */
        if(i!==(pathParts.length-1)){
            if (pathParts[i] in currentObject) {
                parentKey = pathParts[i];
                currentObject = currentObject[pathParts[i]];
                parentObject = currentObject;
            }else{
                sendResponse(response, 422, "text/html", ` Error space found, but failed to find the object at: ${objectPath}`);
                return "";
            }
            /* last iteration */
        }else{
            /* update */
            if(currentObject[pathParts[i]]){
                currentObject[pathParts[i]]=jsonData;
            }else{
                /* add */
                parentObject[pathParts[i]]=jsonData;
            }
        }
    }

    saveJSON(response,spaceData,filePath);

    sendResponse(response, 200, "text/html", `Success, ${JSON.stringify(jsonData)}`);
    return "";
}
async function storeObject(request,response) {

    if(request.method==="DELETE"){
        deleteObject(request,response);
    }
    if(request.method==="PUT" )
    {
       putObject(request,response);
    }

}
module.exports={
    loadObject,
    storeObject,
    loadSpace
}