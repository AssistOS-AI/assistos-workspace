import {Space} from "../../imports.js";

export class SpaceFactory {

    async createSpace(spaceName,apiKey) {
        await system.storage.createSpace(spaceName,apiKey);
    }

    async loadSpace(spaceId) {
       await system.storage.loadSpace(spaceId);

    }
    async initialiseSpace(spaceData) {
        let space = new Space(spaceData);
        await space.loadFlows();
        await space.loadApplicationsFlows();
        return space;
    }
}