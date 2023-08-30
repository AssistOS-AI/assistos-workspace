export class DocumentsRegistry {
    constructor(documents) {
        if (DocumentsRegistry.instance) {
            return DocumentsRegistry.instance;
        }
        this.documents = documents?documents:[];
        DocumentsRegistry.instance = this;
    }

    getDocument(documentId, callback) {
        for(let doc of this.documents) {
            if(doc.id === documentId) {
                return doc;
            }
        }
        return null;
    }

    static getInstance(documents) {
        if(!this.instance) {
            this.instance = new DocumentsRegistry(documents);
        }
        return this.instance;
    }
}
