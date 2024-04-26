export class UpdatePersonality {
    static description = "Updates information about a personality";
    async start(context) {
        try {
            let personalityModule = await this.loadModule("personality");
            await personalityModule.updatePersonality(context.spaceId, context.personalityId, context.personalityData);
            this.return(context.personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}