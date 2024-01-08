export class DeletePersonality {
    static id = "55sNBWJu2rGP";

    constructor() {
        this.name = "DeletePersonality";
        this.description = "Deletes a personality";
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