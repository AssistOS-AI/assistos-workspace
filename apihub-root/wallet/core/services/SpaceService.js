import {Space} from "../models/Space.js";

export class SpaceService {
    async createSpace(spaceName, apiKey) {
        await system.storage.createSpace(spaceName, apiKey);
    }

    async loadSpace(spaceId) {
        const spaceData = (await system.storage.loadSpace(spaceId)).data;
        let space = new Space(spaceData);
        await space.loadFlows();
        system.space = space;
    }

    async changeSpace(spaceId) {
        await this.loadSpace(spaceId);
        await system.refresh();
    }
}