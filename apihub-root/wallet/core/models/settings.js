import { LLM } from "./llm.js";
import { Personality } from "./personality.js";

export class Settings {
    constructor(settingsData) {
        this.llms = [];
        this.personalities = [];
        Object.keys(settingsData.llms).forEach((key, index)=> {
            this.llms.push(new LLM(settingsData.llms[key]));
        });
        Object.keys(settingsData.personalities).forEach((key, index) =>{
            this.personalities.push(new Personality(settingsData.personalities[key]));
        });
        //this.llms = (settingsData.llms || []).map(llm => new LLM(llm.name, llm.apiKeys, llm.url, llm.id));
        //this.personalities = (settingsData.personalities || []).map(personality => new Personality(personality.name, personality.description, personality.id));
    }

    async getScripts(){
        let data = await webSkel.fetchTextResult(`space/${window.currentSpaceId}/myspace/scripts`, true);
        this.scripts = JSON.parse(data);
    }
}