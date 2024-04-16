export class DeleteSpace {
    static id = "DMVGGkSMPhvf";
    static description = "Deletes a space";
    async start(context) {
        try {
            await assistOS.storage.storeSpace(context.spaceId, "");
            await assistOS.services.removeSpaceFromUser(assistOS.user.id, context.spaceId);
            await assistOS.space.changeSpace(assistOS.user.id);
            this.return(context.spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}