export class ChangeSpace {
    static id = "rrEzBTQYEFQp";
    static description = "Changes the current space";
    async start(context) {
        try {
            await system.space.changeSpace(context.spaceId);
            this.return(context.spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}