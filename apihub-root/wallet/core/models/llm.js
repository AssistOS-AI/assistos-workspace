import { Space } from "./space.js";

export class LLM {
    constructor(llmData) {
        this.name = llmData.name || undefined;
        this.apiKeys = llmData.apiKeys || [];
        this.key = this.apiKeys[0] || undefined;
        this.url = llmData.url || undefined;
        this.id = llmData.id || undefined;
    }

    async  suggestTitles(prompt, llmId) {
        if (!webSkel.servicesRegistry.spaceSettingsService.getLLM(llmId)) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await webSkel.servicesRegistry.spaceSettingsService.suggestTitles(prompt, llmId);
    }

    async suggestAbstract(prompt, llmId) {
        if (!webSkel.servicesRegistry.spaceSettingsService.getLLM(llmId)) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await webSkel.servicesRegistry.spaceSettingsService.suggestAbstract(prompt, llmId);
    }

    async suggestChapterIdeas(llm) {
    }

    static async storeLLM(spaceId, llm) {
        await storageManager.storeObject(spaceId, "status", "settings.llms", JSON.stringify(llm));
    }
}