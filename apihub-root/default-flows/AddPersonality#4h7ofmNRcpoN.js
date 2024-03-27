export class AddPersonality {
    static id = "4h7ofmNRcpoN";
    static description = "Adds a new personality. A name and a thorough description of the personality must be provided. The description should contain key human features."
    static inputSchema = {
        name: "string",
        description: "string"
    };
    async start(context) {
        try {
            let personalityData ={
                name: context.name,
                description: context.description,
                image: context.photo
            };
            await system.space.addPersonality(personalityData);
            this.return(personalityData);
        } catch (e) {
            this.fail(e);
        }
    }
}