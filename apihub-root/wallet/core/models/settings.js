import { LLM } from "./llm.js";
import { Personality } from "../../imports.js";

export class Settings {
    constructor(settingsData) {
        this.llms = (settingsData.llms || []).map(llm => new LLM(llm.name, llm.apiKeys, llm.url, llm.id));
        this.personalities = (settingsData.personalities || []).map(personalityData => new Personality(personalityData));
        this.scripts = settingsData.scripts || [];
    }
}