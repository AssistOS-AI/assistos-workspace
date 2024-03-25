import {Space} from "../models/Space.js";

export class SpaceService {
    async createSpace(spaceName, apiKey) {
        await system.storage.createSpace(spaceName, apiKey);
    }

    async loadSpace(spaceId) {
        const spaceData = (await system.storage.loadSpace(spaceId)).data;
        let space = new Space(spaceData);
        await space.loadFlows();
        return space;
    }
    async changeSpace(spaceId) {
        system.space=await this.loadSpace(spaceId);
        await system.refresh();
    }
}