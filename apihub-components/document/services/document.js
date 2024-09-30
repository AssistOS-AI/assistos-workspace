const lightDB = require('../../apihub-component-utils/lightDB.js');

function constructDocumentURI(documentId, property) {
    return `${documentId}${property ? `/${property}` : ''}`
}

async function deleteDocument(spaceId, documentId) {
    return await lightDB.deleteContainerObject(spaceId, documentId);
}

async function getDocument(spaceId, documentId, queryParams) {
    /* TODO Logic needs to be moved at query level */
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.getContainerObject(spaceId, documentId)
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            let documentSegments = {}
            for (const field of queryParams.fields) {
                documentSegments[field] = await lightDB.getEmbeddedObject(spaceId, field, constructDocumentURI(documentId, field))
            }
            return documentSegments
        } else {
            return await lightDB.getEmbeddedObject(spaceId, queryParams.fields, constructDocumentURI(documentId, queryParams.fields))
        }
    }
}

async function getDocumentsMetadata(spaceId) {
    return await lightDB.getContainerObjectsMetadata(spaceId, "documents")
}

async function createDocument(spaceId, documentData) {
    return await lightDB.addContainerObject(spaceId, "documents", documentData)
}

async function updateDocument(spaceId, documentId, documentData, queryParams) {
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.updateContainerObject(spaceId, documentId, documentData)
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            for (const field of queryParams.fields) {
                await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, field), documentData[field])
            }
        } else {
            return await lightDB.updateEmbeddedObject(spaceId, constructDocumentURI(documentId, queryParams.fields), documentData)
        }
    }
}

module.exports = {
    deleteDocument,
    getDocument,
    getDocumentsMetadata,
    createDocument,
    updateDocument
}

