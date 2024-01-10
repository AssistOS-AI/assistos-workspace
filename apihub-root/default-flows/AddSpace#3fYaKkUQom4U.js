export class AddSpace {
    static id = "3fYaKkUQom4U";
    static description = "Adds a new workspace. A name must be provided";
    static parameters = [
        { name: "name", type: "string", description: "The name of the space.", optional: false }
    ]
    constructor(dependencies) {
        const { SpaceFactory } = dependencies;
        this.SpaceFactory = SpaceFactory;
    }

    async start(name) {
        try {
            let spaceData = { name: name };
            let newSpace = await this.SpaceFactory.createSpace(spaceData);
            await webSkel.getService("AuthenticationService").addSpaceToUser(webSkel.currentUser.id, newSpace);
            this.return(spaceData);
        } catch (e) {
            this.fail(e);
        }
    }
}