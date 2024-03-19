export class AddPersonality {
    static id = "4h7ofmNRcpoN";
    static description = "Adds a new personality. A name and a thorough description of the personality must be provided. The description should contain key human features. Optionally, a photo can be added. This photo will be encoded in base 58"
    static parameters = [
        { name: "name", type: "string", description: "The name of the personality.", optional: false },
        { name: "description", type: "string", description: "The description of the personality.", optional: false },
        { name: "photo", type: "string: base58 encoded photo", description: "The photo/image associated with the personality.", optional: true }
    ];
    constructor() {

    }

    async start(name, description, photo) {
        try {
            let personalityData = {
                name: name,
                description: description,
                image: photo
            };
            await system.space.addPersonality(personalityData);
            this.return(personalityData);
        } catch (e) {
            this.fail(e);
        }
    }
}