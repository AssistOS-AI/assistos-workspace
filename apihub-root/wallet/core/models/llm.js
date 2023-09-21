export class LLM {
    constructor(name, apiKeys, url, id) {
        this.name = name || undefined;
        this.apiKeys = apiKeys || [];
        this.key = this.apiKeys[0] || undefined;
        this.url = url || undefined;
        this.id = id || undefined;
    }

    async static suggestTitles(prompt, llmId) {
        if (!webSkel.servicesRegistry.spaceSettingsService.getLLM(llmId)) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await webSkel.servicesRegistry.spaceSettingsService.suggestTitles(prompt, llmId);
    }

    async static suggestAbstract(prompt, llmId) {
        if (!webSkel.servicesRegistry.spaceSettingsService.getLLM(llmId)) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await webSkel.servicesRegistry.spaceSettingsService.suggestAbstract(prompt, llmId);
    }

    async static suggestChapterIdeas(llm) {

    }
}