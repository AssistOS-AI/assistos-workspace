class AddSpace {
    static description = "Adds a new workspace. A name must be provided";
    static inputSchema = {
        name: "string"
    };

    async start(context) {
        try {
            const spaceModule = require('assistos').loadModule('space', {});
            this.return(await spaceModule.createSpace(context.name));
        } catch (e) {
            this.fail(e);
        }
    }
}
module.exports = AddSpace;