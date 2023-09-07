
export class llmsService {
    constructor() {};
    async addLLM(llm) {
        webSkel.company.llms.push(llm);
        await webSkel.localStorage.addLLM(llm);
        webSkel.company.notifyObservers();
    }
    getLLMs() {
        return webSkel.company.llms || [];
    }
}