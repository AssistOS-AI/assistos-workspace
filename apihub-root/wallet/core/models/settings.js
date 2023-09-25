import { LLM } from "./llm.js";
import { Personality } from "./personality.js";

export class Settings {
    constructor(settingsData) {
        Object.keys(settingsData.llms).forEach(function(key, index) {
            this.llms.push(new LLM(settingsData[key]));
        });
        Object.keys(settingsData.personalities).forEach(function(key, index) {
            this.personalities.push(new Personality(settingsData[key]));
        });
        //this.llms = (settingsData.llms || []).map(llm => new LLM(llm.name, llm.apiKeys, llm.url, llm.id));
        //this.personalities = (settingsData.personalities || []).map(personality => new Personality(personality.name, personality.description, personality.id));
    }

    async getScripts(){
        let data = await webSkel.fetchTextResult(`space/${window.currentSpaceId}/myspace/scripts`, true);
        this.scripts = JSON.parse(data);
    }
}