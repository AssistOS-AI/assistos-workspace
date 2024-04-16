export class AddSpace {
    static description = "Adds a new workspace. A name must be provided";
    static inputSchema = {
        name: "string"
    };
    async start(context) {
        try {
            let newSpace = await assistOS.services.createSpace(context.name,context.apiKey);
            this.return(newSpace);
        } catch (e) {
            this.fail(e);
        }
    }
}