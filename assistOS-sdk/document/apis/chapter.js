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
module.exports = {
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
    deleteAlternativeChapter
}