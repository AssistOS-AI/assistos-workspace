async function sendRequest(url, method, data){
    let result;
    let init = {
        method: method
    };
    if(method === "POST" || method === "PUT"){
        init.body = typeof data === "string" ? data : JSON.stringify(data);
        init.headers = {
            "Content-type": "application/json; charset=UTF-8"
        };
    }
    try {
        result = await fetch(url,init);
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}

async function getDocument(){
//not used
}
async function addDocument(spaceId, documentData){
    return await sendRequest(`/spaces/${spaceId}/document`, "POST", documentData);
}
async function updateDocument(spaceId, documentId, documentData){
    return await sendRequest(`/spaces/${spaceId}/document/${documentId}`, "PUT", documentData);
}
async function deleteDocument(spaceId, documentId){
    return await sendRequest(`/spaces/${spaceId}/document/${documentId}`, "DELETE");
}

async function updateDocumentTitle(spaceId, documentId, title) {
    let objectId = `document.${documentId}`;
    return await sendRequest(`/spaces/${spaceId}/title/${objectId}`, "PUT", title);
}
async function updateDocumentTopic(spaceId, documentId, topic) {
    let objectId = `document.${documentId}`;
    return await sendRequest(`/spaces/${spaceId}/topic/${objectId}`, "PUT", topic);
}
async function updateDocumentAbstract(spaceId, documentId, abstract) {
    let objectId = `document.${documentId}`;
    return await sendRequest(`/spaces/${spaceId}/abstract/${objectId}`, "PUT", abstract);
}

async function addDocumentMainIdea(spaceId, documentId, mainIdea){
    let mainIdeaObj= {
        documentId: documentId,
        mainIdea: mainIdea
    }
    return await sendRequest(`/spaces/${spaceId}/mainIdea`, "POST", mainIdeaObj);
}
async function updateDocumentMainIdea(spaceId, documentId, mainIdeaId, mainIdea){
    let objectId = `document.${documentId}.mainIdea.${mainIdeaId}`;
    return await sendRequest(`/spaces/${spaceId}/mainIdea/${objectId}`, "PUT", mainIdea);
}
async function deleteDocumentMainIdea(spaceId, documentId, mainIdeaId){
    let objectId = `document.${documentId}.mainIdea.${mainIdeaId}`;
    return await sendRequest(`/spaces/${spaceId}/mainIdea/${objectId}`, "DELETE");
}

async function addAlternativeTitle(spaceId, documentId, alternativeTitle){
    let alternativeTitleOb= {
        documentId: documentId,
        alternativeTitle: alternativeTitle
    }
    return await sendRequest(`/spaces/${spaceId}/alternativeTitle`, "POST", alternativeTitleOb);
}
async function updateAlternativeTitle(spaceId, documentId, alternativeTitleId, alternativeTitle){
    let objectId = `document.${documentId}.alternativeTitle.${alternativeTitleId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeTitle/${objectId}`, "PUT", alternativeTitle);
}
async function deleteAlternativeTitle(spaceId, documentId, alternativeTitleId){
    let objectId = `document.${documentId}.alternativeTitle.${alternativeTitleId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeTitle/${objectId}`, "DELETE");
}

async function addAlternativeAbstract(spaceId, documentId, alternativeAbstract){
    let alternativeAbstractOb= {
        documentId: documentId,
        alternativeAbstract: alternativeAbstract
    }
    return await sendRequest(`/spaces/${spaceId}/alternativeAbstract`, "POST", alternativeAbstractOb);
}
async function updateAlternativeAbstract(spaceId, documentId, alternativeAbstractId, alternativeAbstract){
    let objectId = `document.${documentId}.alternativeAbstract.${alternativeAbstractId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeAbstract/${objectId}`, "PUT", alternativeAbstract);
}
async function deleteAlternativeAbstract(spaceId, documentId, alternativeAbstractId){
    let objectId = `document.${documentId}.alternativeAbstract.${alternativeAbstractId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeAbstract/${objectId}`, "DELETE");
}

async function addChapter(spaceId, documentId, chapterData){
    let chapterObj ={
        documentId: documentId,
        chapter: chapterData
    }
    return await sendRequest(`/spaces/${spaceId}/chapter`, "POST", chapterObj);
}
async function updateChapter(spaceId, documentId, chapterId, chapterData){
    let objectId = `document.${documentId}.chapter.${chapterId}`;
    return await sendRequest(`/spaces/${spaceId}/chapter/${objectId}`, "PUT", chapterData);
}
async function deleteChapter(spaceId, documentId, chapterId){
    let objectId = `document.${documentId}.chapter.${chapterId}`;
    return await sendRequest(`/spaces/${spaceId}/chapter/${objectId}`, "DELETE");
}

async function swapChapters(spaceId, documentId, chapterId1, chapterId2){
    let objectId = `document.${documentId}.chapter.${chapterId1}`;
    return await sendRequest(`/spaces/${spaceId}/chapterMetadata/${objectId}`, "PUT", chapterId2);
}
async function updateChapterTitle(spaceId, documentId, chapterId, title) {
    let objectId = `document.${documentId}.chapter.${chapterId}`;
    return await sendRequest(`/spaces/${spaceId}/chapterTitle/${objectId}`, "PUT", title);
}
async function addChapterMainIdea(spaceId, documentId, chapterId, mainIdea){
    let mainIdeaObj= {
        documentId: documentId,
        chapterId: chapterId,
        mainIdea: mainIdea
    }
    return await sendRequest(`/spaces/${spaceId}/chapterMainIdea`, "POST", mainIdeaObj);
}
async function updateChapterMainIdea(spaceId, documentId, chapterId, mainIdeaId, mainIdea){
    let objectId = `document.${documentId}.chapter.${chapterId}.chapterMainIdea.${mainIdeaId}`;
    return await sendRequest(`/spaces/${spaceId}/chapterMainIdea/${objectId}`, "PUT", mainIdea);
}
async function deleteChapterMainIdea(spaceId, documentId, chapterId, mainIdeaId){
    let objectId = `document.${documentId}.chapter.${chapterId}.chapterMainIdea.${mainIdeaId}`;
    return await sendRequest(`/spaces/${spaceId}/chapterMainIdea/${objectId}`, "DELETE");
}

async function addChapterAlternativeTitle(spaceId, documentId, chapterId, alternativeTitle){
    let alternativeTitleOb= {
        documentId: documentId,
        chapterId: chapterId,
        alternativeTitle: alternativeTitle
    }
    return await sendRequest(`/spaces/${spaceId}/chapterAlternativeTitle`, "POST", alternativeTitleOb);
}
async function updateChapterAlternativeTitle(spaceId, documentId, chapterId, alternativeTitleId, alternativeTitle){
    let objectId = `document.${documentId}.chapter.${chapterId}.alternativeTitle.${alternativeTitleId}`;
    return await sendRequest(`/spaces/${spaceId}/chapterAlternativeTitle/${objectId}`, "PUT", alternativeTitle);
}
async function deleteChapterAlternativeTitle(spaceId, documentId, chapterId, alternativeTitleId){
    let objectId = `document.${documentId}.chapter.${chapterId}.alternativeTitle.${alternativeTitleId}`;
    return await sendRequest(`/spaces/${spaceId}/chapterAlternativeTitle/${objectId}`, "DELETE");
}

async function addAlternativeChapter(spaceId, documentId, chapterId, alternativeChapter){
    let alternativeChapterOb= {
        documentId: documentId,
        chapterId: chapterId,
        alternativeChapter: alternativeChapter
    }
    return await sendRequest(`/spaces/${spaceId}/alternativeChapter`, "POST", alternativeChapterOb);
}
async function updateAlternativeChapter(spaceId, documentId, chapterId, alternativeChapterId, alternativeChapter){
    let objectId = `document.${documentId}.chapter.${chapterId}.alternativeChapter.${alternativeChapterId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeChapter/${objectId}`, "PUT", alternativeChapter);
}
async function deleteAlternativeChapter(spaceId, documentId, chapterId, alternativeChapterId){
    let objectId = `document.${documentId}.chapter.${chapterId}.alternativeChapter.${alternativeChapterId}`;
    return await sendRequest(`/spaces/${spaceId}/alternativeChapter/${objectId}`, "DELETE");
}

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
export default {
    getDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    updateDocumentTitle,
    updateDocumentTopic,
    updateDocumentAbstract,
    addDocumentMainIdea,
    updateDocumentMainIdea,
    deleteDocumentMainIdea,
    addAlternativeTitle,
    updateAlternativeTitle,
    deleteAlternativeTitle,
    addAlternativeAbstract,
    updateAlternativeAbstract,
    deleteAlternativeAbstract,
    addChapter,
    updateChapter,
    deleteChapter,
    swapChapters,
    updateChapterTitle,
    addChapterMainIdea,
    updateChapterMainIdea,
    deleteChapterMainIdea,
    addChapterAlternativeTitle,
    updateChapterAlternativeTitle,
    deleteChapterAlternativeTitle,
    addAlternativeChapter,
    updateAlternativeChapter,
    deleteAlternativeChapter,
    addParagraph,
    updateParagraph,
    deleteParagraph,
    swapParagraphs,
    updateParagraphText,
    updateParagraphMainIdea,
    addAlternativeParagraph,
    updateAlternativeParagraph,
    deleteAlternativeParagraph
};