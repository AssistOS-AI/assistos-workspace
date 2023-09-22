/*
spaces is root folder
/{companyId}/name
/{companyId}/documents/{documentId}
/{companyId}/documents/{documentId}/title
/{companyId}/documents/{documentId}/abstract
/{companyId}/documents/{documentId}/chapters/{chapterId}
/{companyId}/documents/{documentId}/chapters/{chapterId}/title
/{companyId}/documents/{documentId}/chapters/{chapterId}/paragraphs/{paragraphId}
/{companyId}/documents/{documentId}/settings
/{companyId}/settings/llms/{llmId}
/{companyId}/settings/personalities/{personalityId}
/{companyId}/admins/{adminId}
/{companyId}/announcements/{announcementId}
/{companyId}/users/{userId}*/

const fs = require('fs');

async function loadObject(request, response) {
    const filePath = `../apihub-root/spaces/${request.params.spaceId}.json`;
    const objectPathId = request.params.objectPathId;
    let companyData;
    try {
      companyData = require(filePath);
    } catch (error) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "text/html");
        response.write(error+ ` Error space not found: ${filePath}`);
        response.end();
    }
    const pathParts = objectPathId.split(':');
    let currentObject = companyData;

    for (let part of pathParts) {
        if (part in currentObject) {
            currentObject = currentObject[part];
        } else if (Array.isArray(currentObject)) {
            const index = parseInt(part, 10);
            if (index < currentObject.length && index >= 0) {
                currentObject = currentObject[index];
            } else {
                response.statusCode = 422;
                response.setHeader("Content-Type", "text/html");
                response.write(` Error space found, but failed to find the object at: ${objectPathId}`);
                response.end();
            }
        } else {
            response.statusCode = 422;
            response.setHeader("Content-Type", "text/html");
            response.write(` Error space found, but failed to find the object at: ${objectPathId}`);
            response.end();
        }
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(JSON.stringify(currentObject));
    response.end();

}
async function storeObject(request,response) {
    const jsonData = JSON.parse(request.body.toString());
    const objectPathId = request.params.objectPathId;
    const filePath = `../apihub-root/spaces/${request.params.spaceId}.json`;
    let companyData;
    try {
        companyData = require(filePath);
    } catch (error) {
        response.statusCode = 404;
        response.setHeader("Content-Type", "text/html");
        response.write(error+ ` Error space not found: ${filePath}`);
        response.end();
    }

    const pathParts = objectPathId.split(':');
    let currentObject = companyData;
    let parentObject = null;
    let parentKey = null;

    for (let i=0;i<pathParts.length;i++) {
        parentObject = currentObject;
        if (pathParts[i] in currentObject) {
            if(i!==(pathParts.length-1)){
                parentKey = pathParts[i];
                currentObject = currentObject[pathParts[i]];
            }else{
                /* update */
                if(currentObject[pathParts[i]]){
                    currentObject[pathParts[i]]=jsonData;
                }
                /* add */
                else{
                    parentObject[pathParts[i]]=jsonData;
                }
            }

        } else if (Array.isArray(currentObject)) {
            const index = parseInt(pathParts[i], 10);
            if (index < currentObject.length) {
                parentKey = index;
                currentObject = currentObject[index];
            } else {
                response.statusCode = 422;
                response.setHeader("Content-Type", "text/html");
                response.write(` Error space found, but failed to find the object at: ${objectPathId}`);
                response.end();
            }
        } else {
            response.statusCode = 422;
            response.setHeader("Content-Type", "text/html");
            response.write(` Error space found, but failed to find the object at: ${objectPathId}`);
            response.end();
        }
    }
    try {
        fs.writeFileSync(filePath, JSON.stringify(companyData, null, 2), 'utf8');
    }catch(error){
        response.statusCode = 500;
        response.setHeader("Content-Type", "text/html");
        response.write(error+ ` Error at writing space: ${filePath}`);
        response.end();
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(`Success, ${JSON.stringify(jsonData)}`);
    response.end();
}
module.exports={
    loadObject,
    storeObject
}