const enclave = require("opendsu").loadAPI("enclave");
const {generateId, templateReplacer_$$} = require('../../exporter.js')
('generateId', "templateReplacer_$$");
const document = require('../../templates/json-templates/exporter.js')('document');
const SPACE_CONSTANTS = require('../../constants/exporter.js')('space-constants');

const chapterAPIs = require('./chapter.js');
function getRecordPK(documentId, key){
    return documentId + "#" + key;
}
async function addDocument(spaceId, documentData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let documentId = generateId();
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, SPACE_CONSTANTS.DB_NAMES.DOCUMENTS, documentId, {data:documentId});
    let documentObj = {};
    documentObj = templateReplacer_$$(document, {
        id: documentId,
        title: documentData.title,
        topic: documentData.topic,
    });
    for(let key of Object.keys(documentObj)){
        if(key === "id"){
            continue;
        }
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, getRecordPK(documentId, key), {data:{[key]:documentObj[key]}});
    }
    return documentObj;
}

async function updateDocument() {

}

async function deleteDocument() {

}

async function updateDocumentTitle() {

}

module.exports = {
    document: {
        add: addDocument,
        update: updateDocument,
        remove: deleteDocument
    },
    documentTitle: {
        update: updateDocumentTitle
    },
    chapter: chapterAPIs
};