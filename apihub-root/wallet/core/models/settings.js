import { LLM } from "./llm.js";
import { Personality } from "../../imports.js";

export class Settings {
    constructor(settingsData) {
        this.personalities = (settingsData.personalities || []).map(personalityData => new Personality(personalityData));
    }
}