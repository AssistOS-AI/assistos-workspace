import { StorageService } from './storageService.js';

export class FileSystemStorage extends StorageService {
    constructor() {
        super();
    }
    async loadObject(spaceId, objectType, objectName) {
        const result = await fetch(`/spaces/${spaceId}/${objectType}/${objectName}`,
            {
                method: "GET"
            });
        return await result.text();
    }

    async storeObject(spaceId, objectType, objectName, jsonData) {
        let result;
        try {
            result = await fetch(`/spaces/${spaceId}/${objectType}/${objectName}`,
            {
                method: "PUT",
                body: jsonData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async listObjects(spaceId, objectType){

    }

    async loadSpace(spaceId) {
        const result = await fetch(`/load-space/${spaceId}`, {"method": "GET"});
        return await result.text();
    }

    async storeSpace(spaceId, jsonData) {
        let result;
        try {
            result = await fetch(`/spaces/${spaceId}`,
            {
                method: "PUT",
                body: jsonData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async loadUser(userId){
        const result = await fetch(`/users/${userId}`,
            {
                method: "GET"
            });
        return await result.text();
    }

    async storeUser(userId, jsonData) {
        let result = await fetch(`/users/${userId}`,
                {
                    method: "PUT",
                    body: jsonData,
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });

        return await result.text();
    }

    async loadUserByEmail(email){
        const result = await fetch(`/users/email`,
            {
                method: "PUT",
                body: email,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        return await result.text();
    }
}