export class AddSpace {
    static id = "3fYaKkUQom4U";
    static description = "Adds a new workspace. A name must be provided";
    static inputSchema = {
        name: "string"
    };
    constructor() {
    }

    async start(context) {
        try {
            let newSpace = await system.factories.createSpace(context.name,context.apiKey);
            await system.services.addSpaceToUser(system.user.id, newSpace);
            this.return(newSpace);
        } catch (e) {
            this.fail(e);
        }
    }
}