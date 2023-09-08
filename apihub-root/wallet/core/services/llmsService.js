
export class llmsService {
    constructor(llmName) {
        this.currentLLM = webSkel.company.llms.find(llm => llm.name === llmName);

    };
    async addLLM(llm) {
        webSkel.company.llms.push(llm);
        await webSkel.localStorage.addLLM(llm);
        webSkel.company.notifyObservers();
    }
    getLLMs() {
        return webSkel.company.llms || [];
    }
    getCurrentLLM() {
        return this.currentLLM;
    }
    getLLMByName(name) {
        return webskel.company.llms.find(llm => llm.name === name);
    }
    async summarize(prompt) {
        // Use this.currentLLM.url and this.currentLLM.apiKeys to construct API request
        // Execute API call and return summary
    }
    async proofread(prompt) {
        // Use this.currentLLM.url and this.currentLLM.apiKeys to construct API request
        // Execute API call and return proofread text
    }
}
