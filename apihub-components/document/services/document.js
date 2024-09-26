const lightDB = require('../../apihub-component-utils/lightDB.js');

class DocumentService {
    constructor() {
        if(DocumentService.instance){
            return DocumentService.instance
        }
        DocumentService.instance=this;
    }
    constructDocumentURI(documentId,property) {
        return `${documentId}${property ? `/${property}` : ''}`
    }
    async deleteDocument(spaceId,documentId) {
        return await lightDB.deleteContainerObject(spaceId, documentId);
    }

    async getDocument(spaceId,documentId) {
        return await lightDB.getContainerObject(spaceId, documentId)
    }

    async createDocument(spaceId,documentData) {
        return await lightDB.addContainerObject(spaceId,"documents",documentData)
    }

    async updateDocument(spaceId,documentId,documentData) {
        return await lightDB.updateContainerObject(spaceId, documentId, documentData)
    }
}

module.exports = new DocumentService()
