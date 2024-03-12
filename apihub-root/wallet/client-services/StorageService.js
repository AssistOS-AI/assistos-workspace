export class StorageService{
    constructor() {

    }
    async createSpace(spaceName,apiKey){
        await AssistOS.RequestsFacade.createSpace(spaceName,apiKey);
    }
    async createPersonalSpace(userId){
        await AssistOS.RequestsFacade.createPersonalSpace(userId);
    }

}