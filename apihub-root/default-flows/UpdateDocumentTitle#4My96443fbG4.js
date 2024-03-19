export class UpdateDocumentTitle {
    static id = "4My96443fbG4";
    static description = "Updates the title of a document";

    constructor() {
    }

    async start(documentId, title) {
        try {
            let document = system.space.getDocument(documentId);
            await document.updateTitle(title);
            this.return(title);
        } catch (e) {
            this.fail(e);
        }
    }
}