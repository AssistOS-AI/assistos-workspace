const lightDB = require('../../apihub-component-utils/lightDB.js');

function constructParagraphURI(documentId, paragraphId, property) {
    return `${documentId}/${paragraphId}${property ? `/${property}` : ''}`
}

async function deleteParagraph(spaceId, documentId, chapterId, paragraphId) {
    return await lightDB.deleteEmbeddedObject(spaceId, constructParagraphURI(documentId, paragraphId))
}

async function getParagraph(spaceId, documentId, paragraphId) {
    return await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI(documentId, paragraphId))
}

async function createParagraph(spaceId, documentId, chapterId, paragraphData) {
    return await lightDB.addEmbeddedObject(spaceId, "paragraphs", constructParagraphURI(documentId, "paragraphs"), paragraphData)
}

async function updateParagraph(spaceId, documentId, paragraphId, paragraphData) {
    return await lightDB.updateEmbeddedObject(spaceId, constructParagraphURI(documentId, paragraphId), paragraphData)
}
module.exports={
    deleteParagraph,
    getParagraph,
    createParagraph,
    updateParagraph
}
