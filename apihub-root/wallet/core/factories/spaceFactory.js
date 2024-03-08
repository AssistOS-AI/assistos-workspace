import {Announcement, Space} from "../../imports.js";

export class SpaceFactory {


     static async createSpace(spaceName,apiKey,userId,spaceId) {
         let spaceData={name:spaceName};
        spaceData.id= spaceId||webSkel.appServices.generateId();
        let newSpace = new Space(spaceData);
        newSpace.createDefaultAnnouncement();
        await newSpace.createDefaultFlows();
        await newSpace.createDefaultPersonalities();
        await newSpace.createDefaultAgent();
        await storageManager.storeSpace(newSpace.id, newSpace.stringifySpace(),apiKey,userId);
        await storageManager.storeFlows(newSpace.id, newSpace.stringifyFlows());
        return newSpace;
    }

    static async loadSpace(spaceId) {
        let spacePath = "spaces/" + spaceId;
        let spaceJson = await storageManager.loadSpace(spaceId);
        let spaceData = JSON.parse(spaceJson);
        let space = new Space(spaceData);
        await space.loadFlows();
        return space;
    }
}