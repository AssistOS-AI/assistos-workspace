export class DeleteSpace {
    static id = "DMVGGkSMPhvf";
    static description = "Deletes a space";
    constructor() {

    }

    async start(spaceId) {
        try {
            await system.storage.storeSpace(spaceId, "");
            await system.services.removeSpaceFromUser(system.user.id, spaceId);
            await system.space.changeSpace(system.user.id);
            this.return(spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}