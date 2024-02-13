export class DeleteSpace {
    static id = "DMVGGkSMPhvf";
    static description = "Deletes a space";
    constructor() {

    }

    async start(spaceId) {
        try {
            await storageManager.storeSpace(spaceId, "");
            await webSkel.appServices.removeSpaceFromUser(webSkel.currentUser.id, spaceId);
            await webSkel.currentUser.space.changeSpace(webSkel.currentUser.id);
            this.return(spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}