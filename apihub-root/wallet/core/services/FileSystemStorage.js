const crypto = require("opendsu").loadApi("crypto");
export class FileSystemStorage {
    constructor() {
    }
    async addSpace(spaceName, apiKey, spaceObject) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
            "apikey": `${apiKey}`,
        };
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(spaceObject)
        };
        const response = await fetch(`/spaces/${spaceName}`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    }

    async createSpace(spaceName, apiKey) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        if (apiKey) {
            headers.apikey = apiKey
        }
        const bodyObject = {spaceName: spaceName}
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(bodyObject)
        };
        const response = await fetch(`/spaces`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return (await response.json()).data;
    }

    async loadSpace(spaceId) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        const options = {
            method: "GET",
            headers: headers,
        };

        let requestURL= spaceId?`/spaces/${spaceId}`:`/spaces`;

        const response = await fetch(requestURL, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return (await response.json()).data;

    }

    async updateSpace(spaceId, spaceDataObject) {

    }

    async deleteSpace(spaceId) {

    }

    async registerUser(name, email, password) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        };
        const response = await fetch(`/users`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return await response.json();
    }
    async activateUser(activationToken) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                activationToken: activationToken
            })
        };
        const response = await fetch(`/users/verify`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return await response.json();
    }
    async loginUser(email,password) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                email: email,
                password: password
            })
        };
        const response = await fetch(`/users/login`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return await response.json();
    }

    async loadUser() {
        const response = await fetch(`/users`,
            {
                method: "GET"
            });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }
        return (await response.json()).data;
    }
    async logoutUser(){
        const response = await fetch(`/users/logout`,
            {
                method: "POST"
            });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }
        return (await response.json()).data;
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



    async storeSpace(spaceId, jsonData = null, apiKey = null, userId = null) {
        let headers = {
            "Content-type": "application/json; charset=UTF-8"
        };
        if (apiKey) {
            headers["apikey"] = `${apiKey}`;
            headers["initiatorid"] = `${userId}`;
        }

        let options = {
            method: "PUT",
            headers: headers,
            body: jsonData
        };
        let response = await fetch(`/spaces/${spaceId}`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
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

    async loadUserByEmail(email) {
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

    async loadFlows(spaceId) {
        let result;
        try {
            result = await import(`/flows/${spaceId}`);
        } catch (err) {
            console.error(err);
        }
        return result;
    }

    async storeFlow(spaceId, objectId, jsData) {
        let result;
        objectId = encodeURIComponent(objectId);
        try {
            result = await fetch(`/flows/${spaceId}/${objectId}`,
                {
                    method: "PUT",
                    body: jsData,
                    headers: {
                        "Content-type": "application/javascript; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async storeFlows(spaceId, data) {
        let result;
        try {
            result = await fetch(`/flows/${spaceId}/store/flows`,
                {
                    method: "PUT",
                    body: data,
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async loadDefaultFlows() {
        let result;
        try {
            result = await import(`/flows/default`);
        } catch (err) {
            console.error(err);
        }
        return result;
    }

    async loadDefaultPersonalities() {
        const result = await fetch(`/personalities/default`,
            {
                method: "GET"
            });
        return await result.text();
    }

    async loadDefaultAgent() {
        const result = await fetch(`/agents/default`,
            {
                method: "GET"
            });
        return await result.text();
    }

    async loadFilteredKnowledge(words, agentId) {
        const result = await fetch(`/agents/${system.space.id}/${agentId}/search?param1=${words}`,
            {
                method: "GET"
            });
        return await result.text();
    }

    //applications
    async installApplication(spaceId, applicationId) {
        let result;
        try {
            result = await fetch(`/space/${spaceId}/applications/${applicationId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return {response: await result.text(), status: result.status};
    }

    async getApplicationConfigs(spaceId, appId) {

        let result;
        try {
            result = await fetch(`/space/${spaceId}/applications/${appId}/configs`,
                {
                    method: "GET"
                });
        } catch (err) {
            console.error(err);
        }
        return await result.json();
    }

    async getApplicationFile(spaceId, appId, relativeAppFilePath) {
        const pathParts = relativeAppFilePath.split(".")
        const type = pathParts[pathParts.length - 1] || "";
        if (type !== "js") {
            let result;
            try {
                result = await fetch(`/app/${spaceId}/applications/${appId}/file/${relativeAppFilePath}`,
                    {
                        method: "GET",
                    });
            } catch (err) {
                console.error(err);
            }
            return result;
        } else {
            return await import(`/app/${spaceId}/applications/${appId}/file/${relativeAppFilePath}`);
        }
    }

    async loadAppFlows(spaceId, appName) {
        let result;
        try {
            result = await import(`/flows/${spaceId}/applications/${appName}`);
        } catch (err) {
            console.error(err);
        }
        return result;
    }

    async storeAppFlow(spaceId, appName, objectId, jsData) {
        let result;
        objectId = encodeURIComponent(objectId);
        try {
            result = await fetch(`/flows/${spaceId}/applications/${appName}/${objectId}`,
                {
                    method: "PUT",
                    body: jsData,
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async storeAppObject(appName, objectType, objectId, stringData) {
        objectId = encodeURIComponent(objectId);
        let result;
        try {
            result = await fetch(`/app/${system.space.id}/applications/${appName}/${objectType}/${objectId}`,
                {
                    method: "PUT",
                    body: stringData,
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async loadAppObjects(appName, objectType) {
        let result;
        try {
            result = await fetch(`/app/${system.space.id}/applications/${appName}/${objectType}`,
                {
                    method: "GET"
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async uninstallApplication(spaceId, appName) {
        let result;
        try {
            result = await fetch(`/space/${spaceId}/applications/${appName}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return {response: await result.text(), status: result.status};
    }

    /*GIT*/
    async storeGITCredentials(spaceId, userId, stringData) {
        let result;
        try {
            result = await fetch(`/users/${spaceId}/${userId}/secret`,
                {
                    method: "PUT",
                    body: stringData,
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async getUsersSecretsExist(spaceId) {
        let result;
        try {
            result = await fetch(`/users/${spaceId}/secrets`,
                {
                    method: "GET"
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async deleteKey(spaceId, keyType, keyId) {
        let result;
        try {
            result = await fetch(`/users/${spaceId}/secrets/${keyType}/${keyId}`,
                {
                    method: "DELETE"
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }

    async addKeyToSpace(spaceId, userId, keyType, apiKey) {
        let result;
        let headers = {
            "Content-type": "application/json; charset=UTF-8"
        };
        if (apiKey) {
            headers["apikey"] = `${apiKey}`;
            headers["initiatorid"] = `${userId}`;
        }
        try {
            result = await fetch(`/spaces/${spaceId}/secrets`,
                {
                    method: "POST",
                    headers: headers
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }
}