import {Space} from "../../imports.js";

export class SpaceFactory {

    async createSpace(spaceName,apiKey) {
        await system.storage.createSpace(spaceName,apiKey);
    }

    async loadSpace(spaceId) {
        const spaceData= await system.storage.loadSpace(spaceId);
        let space = new Space(spaceData);
        await space.loadFlows();
        return space;
    }
}