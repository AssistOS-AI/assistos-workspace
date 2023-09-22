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
async function loadObject(companyId, objectPathId) {
    const filePath = `./${companyId}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
    }

    const companyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const pathParts = objectPathId.split('/');
    let currentObject = companyData;

    for (let part of pathParts) {
        if (part in currentObject) {
            currentObject = currentObject[part];
        } else if (Array.isArray(currentObject)) {
            const index = parseInt(part, 10);
            if (index < currentObject.length && index >= 0) {
                currentObject = currentObject[index];
            } else {
                throw new Error(`Path not found: ${objectPathId}`);
            }
        } else {
            throw new Error(`Path not found: ${objectPathId}`);
        }
    }

    return currentObject;
}
async function storeObject(companyId, objectPathId, jsonData) {
    const filePath = `./${companyId}.json`;
    if (!fs.existsSync(filePath)) {
        throw new Error("File not found");
    }

    const companyData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const pathParts = objectPathId.split('/');
    let currentObject = companyData;
    let parentObject = null;
    let parentKey = null;

    for (let part of pathParts) {
        parentObject = currentObject;

        if (part in currentObject) {
            parentKey = part;
            currentObject = currentObject[part];
        } else if (Array.isArray(currentObject)) {
            const index = parseInt(part, 10);
            if (index < currentObject.length) {
                parentKey = index;
                currentObject = currentObject[index];
            } else {
                throw new Error(`Path not found: ${objectPathId}`);
            }
        } else {
            throw new Error(`Path not found: ${objectPathId}`);
        }
    }
    parentObject[parentKey] = jsonData;

    fs.writeFileSync(filePath, JSON.stringify(companyData, null, 2), 'utf8');
}
module.exports={
    loadObject,
    storeObject
}