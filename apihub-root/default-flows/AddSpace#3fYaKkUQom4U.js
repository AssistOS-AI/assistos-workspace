import {SpaceFactory} from "../../../wallet/imports.js";
export class AddSpace {
    static id = "3fYaKkUQom4U";

    constructor() {
        this.name = "AddSpace";
        this.description = "Adds a new workspace. A name must be provided";
        this.parameters = [
            { name: "name", type: "string", description: "The name of the space.", optional: false }
        ]

    }

    async start(name) {
        try {
            let spaceData = { name: name };
            let newSpace = await SpaceFactory.createSpace(spaceData);
            await webSkel.getService("AuthenticationService").addSpaceToUser(webSkel.currentUser.id, newSpace);
            this.return(spaceData);
        } catch (e) {
            this.fail(e);
        }
    }
}