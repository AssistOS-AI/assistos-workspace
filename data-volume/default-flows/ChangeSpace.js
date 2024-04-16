export class ChangeSpace {
    static description = "Changes the current space";
    async start(context) {
        try {
            await assistOS.space.changeSpace(context.spaceId);
            this.return(context.spaceId);
        } catch (e) {
            this.fail(e);
        }
    }
}