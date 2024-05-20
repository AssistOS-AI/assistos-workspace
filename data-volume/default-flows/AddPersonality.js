class AddPersonality {
    static description = "Adds a new personality. A name and a thorough description of the personality must be provided. The description should contain key human features."
    static inputSchema = {
        spaceId: "string",
        name: "string",
        description: "string"
    };
    async start(context) {
        try {
            let personalityModule = await this.loadModule("personality");
            let personalityData ={
                name: context.name,
                description: context.description,
                image: context.photo,
                metadata: ["name", "id", "photo"]
            };
            await personalityModule.addPersonality(context.spaceId, personalityData);
            this.return(personalityData);
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddPersonality;