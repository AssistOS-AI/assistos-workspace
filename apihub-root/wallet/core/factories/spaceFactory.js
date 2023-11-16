import {Announcement, Space} from "../../imports.js";

export class SpaceFactory {

    static generateDefaultAnnouncement(spaceData) {
        return {
            id: webSkel.servicesRegistry.UtilsService.generateId(),
            title: "Welcome to AIAuthor!",
            text: `Space ${spaceData.name} was successfully created. You can now add documents, users and settings to your space.`,
            date: new Date().toISOString().split('T')[0]
        };
    }
     static async createSpace(spaceData) {
        spaceData.id=webSkel.servicesRegistry.UtilsService.generateId();
        spaceData.announcements=[this.generateDefaultAnnouncement(spaceData)];
        let newSpace = new Space(spaceData);
        await newSpace.createDefaultScripts();
        await newSpace.createDefaultPersonalities();
        await newSpace.createDefaultAgent();
        await storageManager.storeSpace(newSpace.id, newSpace.stringifySpace());
        return newSpace;
    }

    static async loadSpace(spaceId) {
        let spacePath = "spaces/" + spaceId;
        let spaceJson = await webSkel.storageService.loadObject(spacePath, spaceJson);
        let space = JSON.parse(spaceJson);
        return new Space(space);
    }
}