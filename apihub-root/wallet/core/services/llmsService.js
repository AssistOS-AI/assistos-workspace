
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
    getLLM(llmId) {
        return webskel.company.llms.find(llm => llm.id === llmId);
    }
    async summarize(prompt,llmId) {
        let llm=this.getLLM(llmId);
        const data = await this.llmApiFetch(llm.url, llm.apiKeys, prompt);
    }
    async proofread(prompt,llmId) {
        let llm=this.getLLM(llmId);
        const data = await this.llmApiFetch(llm.url, llm.apiKeys, prompt);

    }
    async llmApiFetch(url,apiKey,prompt) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: `${prompt}` }
                ],
                temperature: 0.7
            })
        };

        try{
            const response = await fetch(url, options);
            if (response.status !== 200) {
                console.log(`Response Status: ${response.status}`);
                console.log(`Response Text: ${await response.text()}`);
                throw new Error(`Failed to fetch: ${response.status}`);
            }
            const result = await response.json();
            console.log('API Response:', result.choices[0].message.content);
        } catch (error) {
            console.log('API call failed:', error);
        }
    }
}
