export class Claude3 {
    constructor(config, apiKey) {
        this.config = config;
        this.apiKey = apiKey;
    }

    async generateText(prompt) {
        return "Claude 3 generated text";
    }
}