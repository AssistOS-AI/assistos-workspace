export class ChangeSpace {
    static id = "rrEzBTQYEFQp";
    static description = "Changes the current space";
    constructor() {

    }

    async start(context) {
        try {
            await system.space.changeSpace(context.spaceId);
            this.return(spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}