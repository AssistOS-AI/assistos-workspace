import {Space} from "../../imports.js";

export class SpaceFactory {


    async createSpace(spaceName,apiKey,userId,spaceId) {
         let spaceData={name:spaceName};
        spaceData.id= spaceId||system.services.generateId();
        let newSpace = new Space(spaceData);
        newSpace.createDefaultAnnouncement();
        await newSpace.createDefaultFlows();
        await newSpace.createDefaultPersonalities();
        await newSpace.createDefaultAgent();
        await system.storage.storeSpace(newSpace.id, newSpace.stringifySpace(),apiKey,userId);
        await system.storage.storeFlows(newSpace.id, newSpace.stringifyFlows());
        return newSpace;
    }

    async loadSpace(spaceId) {
        let spaceJson = await system.storage.loadSpace(spaceId);
        let spaceData = JSON.parse(spaceJson);
        let space = new Space(spaceData);
        await space.loadFlows();
        return space;
    }
}