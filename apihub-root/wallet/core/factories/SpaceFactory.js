import {Space} from "../../imports.js";

export class SpaceFactory {

    async createSpace(spaceName,apiKey) {
        await system.storage.createSpace(spaceName,apiKey);
    }

    async loadSpace(spaceId) {
        let spaceJson = await system.storage.loadSpace(spaceId);
        let spaceData = JSON.parse(spaceJson);
        let space = new Space(spaceData);
        await space.loadFlows();
        return space;
    }
}