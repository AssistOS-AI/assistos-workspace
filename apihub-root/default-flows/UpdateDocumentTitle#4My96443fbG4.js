export class UpdateDocumentTitle {
    static id = "4My96443fbG4";
    static description = "Updates the title of a document";

    constructor() {
    }

    async start(context) {
        try {
            let document = system.space.getDocument(context.documentId);
            await document.updateTitle(context.title);
            this.return(context.title);
        } catch (e) {
            this.fail(e);
        }
    }
}