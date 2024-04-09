async function getDocuments(spaceId){
    let result;
    try {
        result = await fetch(`/spaces/${spaceId}/documents`,
            {
                method: "GET",
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
async function getDocument(){

}
async function addDocument(spaceId, documentData){
    let result;
    try {
        result = await fetch(`/spaces/${spaceId}/document`,
            {
                method: "POST",
                body: documentData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
async function updateDocument(spaceId, documentId, documentData){
    let result;
    try {
        result = await fetch(`/spaces/${spaceId}/documents/${documentId}`,
            {
                method: "PUT",
                body: documentData,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}
async function deleteDocument(spaceId, documentId){
    let result;
    try {
        result = await fetch(`/spaces/${spaceId}/documents/${documentId}`,
            {
                method: "PUT",
                body: "",
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });
    } catch (err) {
        console.error(err);
    }
    return await result.text();
}

async function addChapter(){

}
async function updateChapter(){

}
async function deleteChapter(){

}

async function addParagraph(){

}
async function updateParagraph(){

}
async function deleteParagraph(){

}

export default {getDocuments, getDocument, addDocument, updateDocument, deleteDocument, addChapter, updateChapter, deleteChapter, addParagraph, updateParagraph, deleteParagraph};