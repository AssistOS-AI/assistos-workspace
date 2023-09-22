import { StorageService } from './storageService.js';
import fs from 'fs';
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
export class FileSystemStorage extends StorageService{
    constructor(){
        super();
    }

    async loadObject(spaceId, objectPathId) {
        const filePath = `./${spaceId}.json`;
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found");
        }

        const spaceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const pathParts = objectPathId.split('/');
        let currentObject = spaceData;

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
    async storeObject(spaceId, objectPathId, jsonData) {
        const filePath = `./${spaceId}.json`;
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found");
        }

        const spaceData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const pathParts = objectPathId.split('/');
        let currentObject = spaceData;
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

        fs.writeFileSync(filePath, JSON.stringify(spaceData, null, 2), 'utf8');
    }

}