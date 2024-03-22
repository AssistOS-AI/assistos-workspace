export class UpdatePersonality {
    static id = "2kvVZst5g3gt";
    static description = "Updates information about a personality";
    constructor() {
    }

    async start(context) {
        try {
            await system.space.updatePersonality(context.personalityData, context.personalityId);
            this.return(context.personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}