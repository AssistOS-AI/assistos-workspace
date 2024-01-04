export class FileSystemStorage{
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

    async loadDefaultFlows(){
        const result = await fetch(`/flows/default`,
            {
                method: "GET"
            });
        return await result.text();
    }
    async loadDefaultPersonalities(){
        const result=await fetch(`/personalities/default`,
            {
                method: "GET"
            });
        return await result.text();
    }
    async loadDefaultAgent(){
        const result=await fetch(`/agents/default`,
            {
                method: "GET"
            });
        return await result.text();
    }

    async loadFilteredKnowledge(words, agentId){
        const result=await fetch(`/agents/${webSkel.currentUser.space.id}/${agentId}/search?param1=${words}`,
            {
                method: "GET"
            });
        return await result.text();
    }
    //applications
    async installApplication(spaceId,applicationId) {
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
        return await result.text();

    }
    async getApplicationConfigs(spaceId, appId){

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
    async getApplicationFile(spaceId, appId, filePath){
        let result;
        try {
            result = await fetch(`/app/${webSkel.currentUser.space.id}/applications/${appId}/${filePath}`,
                {
                    method: "GET"
                });
        } catch (err) {
            console.error(err);
        }
        return result;
    }
    async loadPresenter(spaceId, appId, presenterPath){
        return await import(`/app/${webSkel.currentUser.space.id}/applications/${appId}/${presenterPath}`);
    }
    async loadService(spaceId, appId, servicePath){
        return await import(`/app/${webSkel.currentUser.space.id}/applications/${appId}/${servicePath}`);
    }
    async loadObjects(spaceId, appName, objectType){
        let result;
        try {
            result = await fetch(`/app/${spaceId}/applications/${appName}/${objectType}`,
                {
                    method: "GET"
                });
        } catch (err) {
            console.error(err);
        }
        return await result.text();
    }
    async storeAppObject(spaceId, appName, objectType, objectId, stringData){
        let result;
        try {
            result = await fetch(`/app/${spaceId}/applications/${appName}/${objectType}/${objectId}`,
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
        return await result.text();
    }
    async reinstallApplication(spaceId, appName){
        let result;
        try{
            result=await fetch(`/space/${spaceId}/applications/${appName}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8"
                    }
                });
        }catch(err){
            console.error(err);
        }
        return await result.text();
    }
}