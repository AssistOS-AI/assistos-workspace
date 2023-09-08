import {llmsService} from '../../imports.js';
export class proofReaderService{
    constructor(textLength,personality,llm,language,variants,prompt){
        this.textLength=textLength||undefined;
        this.personality=personality||undefined;
        this.llm=llm||undefined;
        this.language=language||undefined;
        this.variants=variants||undefined;
        this.prompt=prompt;
    }
    /* to move to summarizer class */
    async summarize(llmName) {
        const llmService = new llmsService(llmName);

        if (!llmService.getCurrentLLM()) {
            throw new Error(`LLM with name ${llmName} not found.`);
        }

        const summaryResults = [];
        for (let i = 0; i < this.variants; i++) {
            const result = await llmService.summarize(this.prompt);
            summaryResults.push(result);
        }
        return summaryResults;
    }
    async proofRead(llmName) {
        const llmService = new llmsService(llmName);

        if (!llmService.getCurrentLLM()) {
            throw new Error(`LLM with name ${llmName} not found.`);
        }

        const proofReadResults = [];
        for (let i = 0; i < this.variants; i++) {
            const result = await llmService.proofread(this.prompt);
            proofReadResults.push(result);
        }
        return proofReadResults;
    }
}