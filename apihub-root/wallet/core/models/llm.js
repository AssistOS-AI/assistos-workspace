export class LLM {
    constructor(name, apiKeys, url, id) {
        this.name = name || undefined;
        this.apiKeys = apiKeys || [];
        this.key = this.apiKeys[0] || undefined;
        this.url = url || undefined;
        this.id = id || undefined;
    }
}