export class DocumentsRegistry {
    constructor(storage) {
        if (DocumentsRegistry.instance) {
            return DocumentsRegistry.instance;
        }
        this.documents = storage?storage:[];
        DocumentsRegistry.instance = this;
    }

    listDocuments(){}
    loadDocument(){}
    listPersonalities(){}
    loadPersonality(){}
    listLlms(){}
    loadLLMConfig(){}

    getDocument(documentId, callback) {
        for(let doc of this.documents) {
            if(doc.id === documentId) {
                return doc;
            }
        }
        return null;
    }
    addDocument(document) {
        this.documents.push(document);
        webSkel.localStorage.addDocument(document);
    }
    static getInstance(documents) {
        if(!this.instance) {
            this.instance = new DocumentsRegistry(documents);
        }
        return this.instance;
    }
}
