class DeletePersonality {
    static description = "Deletes a personality";
    async start(context) {
        try {
            let personalityModule = await this.loadModule("personality");
            await personalityModule.deletePersonality(context.spaceId, context.personalityId);
            this.return(context.personalityId);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = DeletePersonality;