export class RequestsFacade {
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

        return await response.json();
    }

    async getSpace(spaceId) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        const options = {
            method: "GET",
            headers: headers,
        };
        const response = await fetch(`/spaces/${spaceId}`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return await response.json();

    }

    async updateSpace(spaceId, spaceDataObject) {

    }

    async deleteSpace(spaceId) {

    }

    async registerUser(name, email, secretToken) {
        const headers = {
            "Content-Type": "application/json; charset=UTF-8",
        };
        const options = {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                name: name,
                email: email,
                secretToken: secretToken
            })
        };
        const response = await fetch(`/users`, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }

        return await response.json();
    }

    async loadUser(userId) {
        const response = await fetch(`/users/${userId}`,
            {
                method: "GET"
            });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${response.message}`);
        }
        return (await response.json()).data;
    }
}