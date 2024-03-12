export class StorageService{
    constructor() {

    }
    async createSpace(userId,spaceName,apiKey){
        await AssistOS.RequestsFacade.createSpace(userId,spaceName,apiKey);
    }
    async createPersonalSpace(userId){
        await AssistOS.RequestsFacade.createPersonalSpace(userId);
    }

}