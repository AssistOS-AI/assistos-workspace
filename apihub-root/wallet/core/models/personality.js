export class Personality {
    constructor(personalityData) {
        this.name = personalityData.name || undefined;
        this.description = personalityData.description || undefined;
        this.id = personalityData.id || undefined;
    }

    static async storePersonality(spaceId, personality) {
        await storageManager.storeObject(spaceId, "status", "settings.personalities", JSON.stringify(personality));
    }
}