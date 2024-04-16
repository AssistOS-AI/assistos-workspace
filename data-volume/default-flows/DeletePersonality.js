export class DeletePersonality {
    static description = "Deletes a personality";
    async start(context) {
        try {
            await assistOS.space.deletePersonality(context.personalityId);
            this.return(context.personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}