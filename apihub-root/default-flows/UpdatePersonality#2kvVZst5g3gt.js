export class UpdatePersonality {
    static id = "2kvVZst5g3gt";
    static description = "Updates information about a personality";
    constructor() {
    }

    async start(personalityData, personalityId) {
        try {
            await webSkel.currentUser.space.updatePersonality(personalityData, personalityId);
            this.return(personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}