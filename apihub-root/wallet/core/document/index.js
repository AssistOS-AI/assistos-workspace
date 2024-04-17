import {Document} from "./Document.js";

function createDocumentsInstance() {
    let documents = null;
    function getInstance(documentsData) {
        if (!documents) {
            documents = (documentsData|| []).map(documentData => new Document(documentData)).reverse();
        }
        return documents;
    }
    return {
        getInstance
    };
}
function getDocument(documentId) {
    const document = this.documents.find(document => document.id === documentId);
    return document || null;
}
async function addDocument(documentData) {
    documentData.position = this.documents.length;
    let document = JSON.parse(await assistOS.storage.addDocument(assistOS.space.id,  documentData));
    this.documents.push(new Document(document));
    return document.id;
}

async function deleteDocument(documentId) {
    this.documents = this.documents.filter(document => document.id !== documentId);
    await assistOS.storage.deleteDocument(assistOS.space.id, documentId);
}
const documents = createDocumentsInstance();
export {
    documents
};