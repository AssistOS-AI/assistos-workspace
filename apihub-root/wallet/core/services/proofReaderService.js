import { Space } from "../../imports.js";

export class proofReaderService {
    constructor(textLength, personality, llmId, language, variantsCount, prompt) {
        this.textLength = textLength || undefined;
        this.personality = personality || undefined;
        this.llmId = llmId || undefined;
        this.language = language || undefined;
        this.variantsCount = variantsCount || 1;
        this.prompt = prompt;
    }

    /* to move to summarizer class */
    async summarize() {
        if (!webSkel.space.getLLM(this.llmId)) {
            throw new Error(`LLM with id ${this.llmId} not found.`);
        }
        const summaryResults = [];
        for (let i = 0; i < this.variantsCount; i++) {
            const result = await webSkel.space.summarize(this.prompt, this.llmId);
            summaryResults.push(result);
        }
        return summaryResults;
    }

    async proofRead() {
        if (!webSkel.space.getLLM(this.llmId)) {
            throw new Error(`LLM with id ${this.llmId} not found.`);
        }
        const proofReadResults = [];
        for (let i = 0; i < this.variantsCount; i++) {
            const result = await webSkel.space.proofread(this.prompt, this.llmId);
            proofReadResults.push(result);
        }
        return proofReadResults;
    }
}