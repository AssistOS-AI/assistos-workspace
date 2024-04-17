async function addParagraph(spaceId, documentId, chapterId, paragraphData){
    let paragraphObj ={
        documentId: documentId,
        chapterId: chapterId,
        paragraph: paragraphData
    }
    return await sendRequest(`/spaces/${spaceId}/paragraph`, "POST", paragraphObj);
}
async function updateParagraph(spaceId, documentId, chapterId, paragraphId, paragraphData){
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId}`;
    return await sendRequest(`/spaces/${spaceId}/paragraph/${objectId}`, "PUT", paragraphData);
}
async function deleteParagraph(spaceId, documentId, chapterId, paragraphId){
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId}`;
    return await sendRequest(`/spaces/${spaceId}/paragraph/${objectId}`, "DELETE");
}

async function swapParagraphs(spaceId, documentId, chapterId, paragraphId1, paragraphId2){
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId1}`;
    return await sendRequest(`/spaces/${spaceId}/paragraphMetadata/${objectId}`, "PUT", paragraphId2);
}
async function updateParagraphText(spaceId, documentId, chapterId, paragraphId, text) {
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId}`;
    return await sendRequest(`/spaces/${spaceId}/paragraphText/${objectId}`, "PUT", text);
}
async function updateParagraphMainIdea(spaceId, documentId, chapterId, paragraphId, mainIdea) {
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId}`;
    return await sendRequest(`/spaces/${spaceId}/paragraphMainIdea/${objectId}`, "PUT", mainIdea);
}

async function addAlternativeParagraph(spaceId, documentId, chapterId, paragraphId, alternativeParagraph){
    let alternativeParagraphOb= {
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: paragraphId,
        alternativeParagraph: alternativeParagraph
    }
    return await sendRequest(`/spaces/${spaceId}/alternativeParagraph`, "POST", alternativeParagraphOb);
}
async function updateAlternativeParagraph(spaceId, documentId, chapterId, paragraphId, alternativeParagraphId, alternativeParagraph){
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId}.alternativeParagraph.${alternativeParagraphId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeParagraph/${objectId}`, "PUT", alternativeParagraph);
}
async function deleteAlternativeParagraph(spaceId, documentId, chapterId, paragraphId, alternativeParagraphId){
    let objectId = `document.${documentId}.chapter.${chapterId}.paragraph.${paragraphId}.alternativeParagraph.${alternativeParagraphId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeParagraph/${objectId}`, "DELETE");
}
module.exports = {
    addParagraph,
    updateParagraph,
    deleteParagraph,
    swapParagraphs,
    updateParagraphText,
    updateParagraphMainIdea,
    addAlternativeParagraph,
    updateAlternativeParagraph,
    deleteAlternativeParagraph
}