export class AddSpace {
    static id = "3fYaKkUQom4U";
    static description = "Adds a new workspace. A name must be provided";
    static parameters = [
        { name: "name", type: "string", description: "The name of the space.", optional: false }
    ]
    constructor() {
    }

    async start(name,apiKey) {
        try {
            let newSpace = await system.factories.createSpace(name,apiKey);
            await system.services.addSpaceToUser(system.user.id, newSpace);
            this.return(newSpace);
        } catch (e) {
            this.fail(e);
        }
    }
}