export class DeletePersonality {
    static id = "55sNBWJu2rGP";
    static description = "Deletes a personality";
    constructor() {

    }

    async start(personalityId) {
        try {
            await webSkel.currentUser.space.deletePersonality(personalityId);
            this.return(personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}