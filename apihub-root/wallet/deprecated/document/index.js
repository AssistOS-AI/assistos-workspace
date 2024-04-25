import {Document} from "./Document.js";

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
