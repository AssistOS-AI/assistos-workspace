import { llmsService } from "../../imports.js";

export class brainstormingService {
    constructor() {

    }

    async suggestTitles(prompt, llmId) {
        const llmService = new llmsService();
        if (!llmService.getLLM(llmId)) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await llmService.suggestTitles(prompt, llmId);
    }

    async suggestAbstract(prompt, llmId) {
        const llmService = new llmsService();
        if (!llmService.getLLM(llmId)) {
            throw new Error(`LLM with id ${llmId} not found.`);
        }
        return await llmService.suggestAbstract(prompt, llmId);
    }

    suggestChapterIdeas(llm) {

    }
}