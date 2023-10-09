import { Personality } from "../../imports.js";

export class Settings {
    constructor(settingsData) {
        this.personalities = (settingsData.personalities || []).map(personalityData => new Personality(personalityData));
    }

    getPersonality(id){
        return this.personalities.find(personality => personality.id === id);
    }
}