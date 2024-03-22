export class DeleteSpace {
    static id = "DMVGGkSMPhvf";
    static description = "Deletes a space";
    constructor() {

    }

    async start(context) {
        try {
            await system.storage.storeSpace(context.spaceId, "");
            await system.services.removeSpaceFromUser(system.user.id, context.spaceId);
            await system.space.changeSpace(system.user.id);
            this.return(context.spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}