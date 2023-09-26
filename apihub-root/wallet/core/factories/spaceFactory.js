import { DocumentModel, Space } from "../../imports.js";

export class SpaceFactory {
    static createSpace(spaceName) {
        let openDSU = require("opendsu");
        let crypto = openDSU.loadApi("crypto");
        let spaceData = { id: crypto.getRandomSecret(16).toString().split(",").join(""),
                                            name: spaceName};
        return new Space(spaceData);
    }

    static async loadSpace(spaceId) {
        let spacePath = "spaces/" + spaceId;
        let spaceJson = await webSkel.storageService.loadObject(spacePath, spaceJson);
        let space = JSON.parse(spaceJson);
        return new Space(space);
    }
}