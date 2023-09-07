
export class llmsService {
    constructor() {};

    async addLLM(llm) {
        company.llms.push(llm);
        await webSkel.localStorage.addLLM(llm);
        company.notifyObservers();
    }
    getLLMs() {
        return company.llms || [];
    }
}