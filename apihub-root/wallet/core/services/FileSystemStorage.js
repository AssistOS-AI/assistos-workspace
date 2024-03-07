export class FileSystemStorage {
    constructor() {
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

    async loadSpace(spaceId) {
        const result = await fetch(`/load-space/${spaceId}`, {"method": "GET"});
        return await result.text();
    }

    async storeSpace(spaceId, jsonData = null, apiKey = null,userId=null) {
        let headers = {
            "Content-type": "application/json; charset=UTF-8"
        };
        debugger
        if (apiKey) {
            headers["apikey"] = `${apiKey}`;
            headers["initiatorid"]=`${userId}`;
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


    async loadUser(userId) {
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
        const result = await fetch(`/agents/${webSkel.currentUser.space.id}/${agentId}/search?param1=${words}`,
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
        const pathParts=relativeAppFilePath.split(".")
        const type=pathParts[pathParts.length-1]||"";
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

    async loadManager(spaceId, appId, managerPath) {
        return await import(`/app/${spaceId}/applications/${appId}/files/${managerPath}`);
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
            result = await fetch(`/app/${webSkel.currentUser.space.id}/applications/${appName}/${objectType}/${objectId}`,
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
            result = await fetch(`/app/${webSkel.currentUser.space.id}/applications/${appName}/${objectType}`,
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
}