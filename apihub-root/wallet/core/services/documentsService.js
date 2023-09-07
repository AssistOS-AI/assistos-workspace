
export class documentsService {
    constructor(){}
    observeDocument(documentId){
        if(company.documents.find(document => document.id === documentId))
            this.currentDocumentId = documentId;
    }
    getAllDocuments() {
        return company.documents || [];
    }

    getDocument(documentId) {
        const document = company.documents.find(document => document.id === documentId);
        return document || null;
    }

    async addDocument(document) {
        document.id=await webSkel.localStorage.addDocument(document,webSkel.company.id);
        company.documents.push(document);
        company.notifyObservers();
    }

    async deleteDocument(documentId) {
        const index = company.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            company.documents.splice(index, 1);
            await webSkel.localStorage.deleteDocument(company.id, documentId);
            company.notifyObservers();
        }
    }

    async updateDocument(documentId, document) {
        const index = company.documents.findIndex(document => document.id === documentId);
        if (index !== -1) {
            company.documents[index] = document;
            await webSkel.localStorage.updateDocument(company.id, documentId, document);
            company.notifyObservers();
        }
    }
}