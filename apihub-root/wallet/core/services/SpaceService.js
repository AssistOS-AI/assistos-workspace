import {Space} from "../models/Space.js";

export class SpaceService {
    async createSpace(spaceName, apiKey) {
        await assistOS.storage.createSpace(spaceName, apiKey);
    }

    async loadSpace(spaceId) {
        const spaceData = (await assistOS.storage.loadSpace(spaceId)).data;
        let space = new Space(spaceData);
        await space.loadFlows();
        assistOS.space = space;
        await space.loadApplicationsFlows();
    }

    async changeSpace(spaceId) {
        await this.loadSpace(spaceId);
        await assistOS.refresh();
    }
}