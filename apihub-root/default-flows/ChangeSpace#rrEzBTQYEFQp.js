export class ChangeSpace {
    static id = "rrEzBTQYEFQp";

    constructor() {
        this.name = "ChangeSpace";
        this.description = "Changes the current space";
    }

    async start(spaceId) {
        try {
            await webSkel.currentUser.space.changeSpace(spaceId);
            this.return(spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}