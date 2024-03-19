export class SpaceFactory {

    constructor() {
        if (!SpaceFactory.instance) {
            SpaceFactory.instance = this;
        }
    }

    static getInstance() {
        if (!SpaceFactory.instance) {
            SpaceFactory.instance = new SpaceFactory();
        } else {
            return SpaceFactory.instance;
        }
    }

    async createSpace(spaceName, apiKey) {
        return await AssistOS.StorageService.createSpace(spaceName,apiKey);
    }
    async createPersonalSpace(userId){
        return await AssistOS.StorageService.createPersonalSpace(userId);
    }

    /* Trebuie mutat intr-un service */
  /*  static async loadSpace(spaceId) {
        let spaceJson = await system.storage.loadSpace(spaceId);
        let spaceData = JSON.parse(spaceJson);
        let space = new Space(spaceData);
        await space.loadFlows();
        return space;
    }*/
}