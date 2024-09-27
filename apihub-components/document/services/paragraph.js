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

async function getParagraph(spaceId, documentId, paragraphId) {
    return await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
        documentId: documentId,
        paragraphId: paragraphId
    }))
}

async function createParagraph(spaceId, documentId, chapterId, paragraphData) {
    return await lightDB.addEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: "paragraphs"
    }), paragraphData)
}

async function updateParagraph(spaceId, documentId, paragraphId, paragraphData) {
    return await lightDB.updateEmbeddedObject(spaceId, constructParagraphURI({
        documentId: documentId,
        paragraphId: paragraphId
    }), paragraphData)
}

module.exports = {
    deleteParagraph,
    getParagraph,
    createParagraph,
    updateParagraph
}
