import { LLM } from "./llm.js";
import { Personality } from "../../imports.js";

export class Settings {
    constructor(settingsData) {
        this.llms = (settingsData.llms || []).map(llmData => new LLM(llmData));
        this.personalities = (settingsData.personalities || []).map(personalityData => new Personality(personalityData));
        this.scripts = settingsData.scripts || [];
    }
}