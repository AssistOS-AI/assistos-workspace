const lightDB = require('../../apihub-component-utils/lightDB.js');

function constructParagraphURI(pathSegments) {
    let paragraphURI = "";
    if (pathSegments.documentId) {
        paragraphURI += `${pathSegments.documentId}/`
    }
    if (pathSegments.chapterId) {
        paragraphURI += `${pathSegments.chapterId}/`
    }
    if (pathSegments.paragraphId) {
        paragraphURI += `${pathSegments.paragraphId}`
    }
    if (pathSegments.property) {
        paragraphURI += `/${pathSegments.property}`
    }
    return paragraphURI;
}

async function deleteParagraph(spaceId, documentId, chapterId, paragraphId) {
    return await lightDB.deleteEmbeddedObject(spaceId, constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: paragraphId
    }))
}

async function getParagraph(spaceId, documentId, paragraphId, queryParams) {
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
            documentId: documentId,
            paragraphId: paragraphId
        }))
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            let paragraphSegments = {}
            for (const field of queryParams.fields) {
                paragraphSegments[field] = await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
                    documentId: documentId,
                    paragraphId: paragraphId,
                    property: field
                }))
            }
            return paragraphSegments
        } else {
            return await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
                documentId: documentId,
                paragraphId: paragraphId,
                property: queryParams.fields
            }))
        }
    }
}

async function createParagraph(spaceId, documentId, chapterId, paragraphData) {
    return await lightDB.addEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: "paragraphs"
    }), paragraphData)
}

async function updateParagraph(spaceId, documentId, paragraphId, paragraphData, queryParams) {
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.updateEmbeddedObject(spaceId, constructParagraphURI({
            documentId: documentId,
            paragraphId: paragraphId
        }), paragraphData)
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            for (const field of queryParams.fields) {
                await lightDB.updateEmbeddedObject(spaceId, constructParagraphURI({
                    documentId: documentId,
                    paragraphId: paragraphId,
                    property: field
                }), paragraphData[field])
            }
        } else {
            return await lightDB.updateEmbeddedObject(spaceId, constructParagraphURI({
                documentId: documentId,
                paragraphId: paragraphId,
                property: queryParams.fields
            }), paragraphData)
        }
    }
}

async function swapParagraphs(spaceId, documentId, chapterId, paragraphId, paragraphId2) {
    return await lightDB.swapEmbeddedObjects(spaceId, constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: "paragraphs"
    }), {
        item1: paragraphId,
        item2: paragraphId2
    })
}


module.exports = {
    deleteParagraph,
    getParagraph,
    createParagraph,
    updateParagraph,
    swapParagraphs
}
