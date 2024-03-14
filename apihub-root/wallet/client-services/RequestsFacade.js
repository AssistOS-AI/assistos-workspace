export class RequestsFacade {
    constructor() {

    }

    async createSpace(spaceName, apiKey) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
            "apikey": `${apiKey}`,
        };

        const body = JSON.stringify({spaceName:spaceName});

        const options = {
            method: "POST",
            headers: headers,
            body: body,
        };

        const response = await fetch('/spaces', options);

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