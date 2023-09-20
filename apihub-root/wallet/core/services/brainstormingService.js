export class brainstormingService {
    async suggestTitles(prompt, llmId) {
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

    suggestChapterIdeas(llm) {

    }
}