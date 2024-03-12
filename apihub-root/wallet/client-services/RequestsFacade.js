export class RequestsFacade {
    constructor() {

    }

    async createSpace(userId, spaceName, apiKey) {
        const headers = {
            "Content-type": "application/json; charset=UTF-8",
            "apikey": `${apiKey}`,
            "initiatorid": `${userId}`
        };

        const options = {
            method: "POST",
            headers: headers,
        };
        const response= await fetch('/spaces',options)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    }
    /* TODO: automat de pe server la crearea unui cont */
    async createPersonalSpace(userId){
        const headers = {
            "Content-type": "application/json; charset=UTF-8",
            "initiatorid": `${userId}`
        };

        const options = {
            method: "POST",
            headers: headers,
        };
        const response= await fetch('/personal-space/',options)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.text();
    }
}