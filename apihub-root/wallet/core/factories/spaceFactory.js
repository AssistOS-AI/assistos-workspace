import { Space } from "../../imports.js";

export class SpaceFactory {
    createSpace() {
        let openDSU = require("opendsu");
        let crypto = openDSU.loadApi("crypto");
        let spaceData = { id: crypto.getRandomSecret(16)};
        return new Space(spaceData);
    }

    async loadSpace(spaceId) {
        let spacePath = "spaces/" + spaceId;
        let spaceJson = await webSkel.storageService.loadObject(spacePath, spaceJson);
        let space = JSON.parse(spaceJson);
        return new Space(space);
    }

    async saveDocument(space) {
        let spacePath = "documents/" + space.id;
        let spaceJson = JSON.stringify(space);
        await webSkel.storageService.saveObject(spacePath, spaceJson);
    }
}