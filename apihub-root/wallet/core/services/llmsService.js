export class LlmsService {
    constructor() {
    }

    async generateResponse(prompt){
        let result = await fetch("llms/generate",
            {
                method: "PUT",
                body: prompt,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
        return await result.text();
    }
}