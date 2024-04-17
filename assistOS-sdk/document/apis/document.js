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
};