export class RequestsFacade {
    constructor() {

    }
    async addSpace(spaceName,apiKey,spaceObject) {
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
            "apikey": `${apiKey}`,
        };
        const bodyObject={spaceName:spaceName}
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify(bodyObject)
        };
        const response = await fetch(`/spaces`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    }
    async getSpace(spaceId){

    }
    async updateSpace(spaceId,spaceDataObject) {

    }
    async deleteSpace(spaceId) {

    }
    async registerUser(userDataObject) {

    }
}