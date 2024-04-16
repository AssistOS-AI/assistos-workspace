export class UpdatePersonality {
    static description = "Updates information about a personality";
    async start(context) {
        try {
            await assistOS.space.updatePersonality(context.personalityData, context.personalityId);
            this.return(context.personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}