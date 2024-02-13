export class AddSpace {
    static id = "3fYaKkUQom4U";
    static description = "Adds a new workspace. A name must be provided";
    static parameters = [
        { name: "name", type: "string", description: "The name of the space.", optional: false }
    ]
    static dependencies = ["SpaceFactory"];
    constructor(SpaceFactory) {
        this.iSpaceFactory = SpaceFactory;
    }

    async start(name) {
        try {
            let spaceData = { name: name };
            let newSpace = await this.iSpaceFactory.createSpace(spaceData);
            await webSkel.appServices.addSpaceToUser(webSkel.currentUser.id, newSpace);
            this.return(spaceData);
        } catch (e) {
            this.fail(e);
        }
    }
}