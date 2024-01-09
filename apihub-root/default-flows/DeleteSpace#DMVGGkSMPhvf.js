export class DeleteSpace {
    static id = "DMVGGkSMPhvf";

    constructor() {
        this.name = "DeleteSpace";
        this.description = "Deletes a space";
    }

    async start(spaceId) {
        try {
            await storageManager.storeSpace(spaceId, "");
            await webSkel.getService("AuthenticationService").removeSpaceFromUser(webSkel.currentUser.id, spaceId);
            await webSkel.currentUser.space.changeSpace(webSkel.currentUser.id);
            this.return(spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}