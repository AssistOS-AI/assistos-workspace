const lightDB = require('../../apihub-component-utils/lightDB.js');

function constructDocumentURI(documentId, property) {
    return `${documentId}${property ? `/${property}` : ''}`
}

async function deleteDocument(spaceId, documentId) {
    return await lightDB.deleteContainerObject(spaceId, documentId);
}

async function getDocument(spaceId, documentId) {
    return await lightDB.getContainerObject(spaceId, documentId)
}

async function createDocument(spaceId, documentData) {
    return await lightDB.addContainerObject(spaceId, "documents", documentData)
}

async function updateDocument(spaceId, documentId, documentData) {
    return await lightDB.updateContainerObject(spaceId, documentId, documentData)
}

module.exports = {
    deleteDocument,
    getDocument,
    createDocument,
    updateDocument
}

