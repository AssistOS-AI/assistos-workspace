export class UpdateAbstract {
    static id = "2ppoRvQFM8cG";
    static description = "Updates the abstract of a document";

    constructor() {
    }

    async start(documentId, text) {
        try {
            let document = system.space.getDocument(documentId);
            await document.updateAbstract(text);
            this.return(documentId);
        } catch (e) {
            this.fail(e);
        }
    }
}