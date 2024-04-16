const enclave = require("opendsu").loadAPI("enclave");
const generateId = require('../../exporter.js')
('generateId');
const SPACE_CONSTANTS = require('../../../constants/exporter.js')('space-constants');
const chapterAPIs = require('./chapter.js');

function splitObjectId(objectId){
    let splitId = objectId.split(".");
    return splitId.filter((element, index) => index % 2 !== 0);
}
const objectTypes = SPACE_CONSTANTS.OBJECT_TYPES;
function getDocumentComponentRecordPK(key, componentId){
    return key + "#" + componentId;
}
async function addDocument(spaceId, documentData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let documentId = generateId();
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, SPACE_CONSTANTS.DB_NAMES.DOCUMENTS, documentId, {data:documentId});
    let documentObj =  {
        id: documentId,
        position: documentData.position,
        title: documentData.title,
        topic: documentData.topic || "",
        abstract: documentData.abstract || "",
        mainIdeas: documentData.mainIdeas || [],
        alternativeTitles: documentData.alternativeTitles || [],
        alternativeAbstracts: documentData.alternativeAbstracts || []
    }

    let positionPK = objectTypes.documentMetadata;
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, positionPK, {data:documentObj.position});
    let chapters = [];
    if(documentData.chapters){
        for (let chapter of documentData.chapters){
            let chapterObj = {
                documentId: documentId,
                chapter: chapter
            }
            chapters.push(await chapterAPIs.chapter.add(spaceId, chapterObj));
        }
    }
    documentObj.chapters = chapters;
    let excludedKeys = ["id", "position", "mainIdeas", "chapters", "alternativeTitles", "alternativeAbstracts"];
    for(let key of Object.keys(documentObj)){
        if(excludedKeys.includes(key)){
            continue;
        }
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, key, {data:documentObj[key]});
    }
    for(let mainIdea of documentObj.mainIdeas){
        let pk = getDocumentComponentRecordPK(objectTypes.mainIdea, mainIdea.id);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:{mainIdea}});
    }
    for(let alternativeTitle of documentObj.alternativeTitles){
        let pk = getDocumentComponentRecordPK(objectTypes.alternativeTitle, alternativeTitle.id);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:{alternativeTitle}});
    }
    for(let alternativeAbstract of documentObj.alternativeAbstracts){
        let pk = getDocumentComponentRecordPK(objectTypes.alternativeAbstract, alternativeAbstract.id);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:{alternativeAbstract}});
    }
    return documentObj;
}
async function updateDocument(spaceId, documentId, documentData) {
    // TODO
    //await deleteDocument(spaceId, documentId);
    //return await addDocument(spaceId, documentData, isUpdate);
}
async function deleteDocument(spaceId, documentId) {
    // TODO
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, SPACE_CONSTANTS.DB_NAMES.DOCUMENTS, documentId);
    //delete table??
}

async function updateDocumentTitle(spaceId, objectId, title) {
    let [documentId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = objectTypes.title;
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:title});
    return documentId;
}
async function updateDocumentTopic(spaceId, objectId, topic) {
    let [documentId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = objectTypes.topic;
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:topic});
    return documentId;
}
async function updateDocumentAbstract(spaceId, objectId, abstract) {
    let [documentId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = objectTypes.abstract;
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:abstract});
    return documentId;
}
//mainIdeas
async function addDocumentMainIdea(spaceId, objectData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let mainIdeaId = generateId();
    let pk = getDocumentComponentRecordPK(objectTypes.mainIdea, mainIdeaId);
    let mainIdeaObj = {
        id: mainIdeaId,
        text: objectData.mainIdea
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectData.documentId, pk, {data:mainIdeaObj});
    return mainIdeaObj;
}
async function updateDocumentMainIdea(spaceId, objectId, mainIdea) {
    let [documentId, mainIdeaId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getDocumentComponentRecordPK(objectTypes.mainIdea, mainIdeaId);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:mainIdea});
    return objectId;
}
async function deleteDocumentMainIdea(spaceId, objectId) {
    let [documentId, mainIdeaId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getDocumentComponentRecordPK(objectTypes.mainIdea, mainIdeaId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
//alternativeTitles
async function addDocumentAlternativeTitle(spaceId, objectData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let alternativeTitleId = generateId();
    let pk = getDocumentComponentRecordPK(objectTypes.alternativeTitle, alternativeTitleId);
    let alternativeTitleObj = {
        id: alternativeTitleId,
        text: objectData.alternativeTitle
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectData.documentId, pk, {data:alternativeTitleObj});
    return alternativeTitleObj;
}
async function updateDocumentAlternativeTitle(spaceId, objectId, alternativeTitle) {
    let [documentId, alternativeTitleId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getDocumentComponentRecordPK(objectTypes.alternativeTitle, alternativeTitleId);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeTitle});
    return objectId;
}
async function deleteDocumentAlternativeTitle(spaceId, objectId) {
    let [documentId, alternativeTitleId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getDocumentComponentRecordPK(objectTypes.alternativeTitle, alternativeTitleId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
//alternativeAbstracts
async function addDocumentAlternativeAbstract(spaceId, objectData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let alternativeAbstractId = generateId();
    let pk = getDocumentComponentRecordPK(objectTypes.alternativeAbstract, alternativeAbstractId);
    let alternativeAbstractObj = {
        id: alternativeAbstractId,
        text: objectData.alternativeAbstract
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectData.documentId, pk, {data:alternativeAbstractObj});
    return alternativeAbstractObj;
}
async function updateDocumentAlternativeAbstract(spaceId, objectId, alternativeAbstract) {
    let [documentId, alternativeAbstractId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getDocumentComponentRecordPK(objectTypes.alternativeAbstract, alternativeAbstractId);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeAbstract});
    return objectId;
}
async function deleteDocumentAlternativeAbstract(spaceId, objectId) {
    let [documentId, alternativeAbstractId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getDocumentComponentRecordPK(objectTypes.alternativeAbstract, alternativeAbstractId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
module.exports = {
    document: {
        add: addDocument,
        delete: deleteDocument,
        update: updateDocument
    },
    title: {
        update: updateDocumentTitle
    },
    topic:{
        update: updateDocumentTopic
    },
    abstract:{
        update: updateDocumentAbstract
    },
    mainIdea:{
        add: addDocumentMainIdea,
        update: updateDocumentMainIdea,
        delete: deleteDocumentMainIdea
    },
    alternativeTitle:{
        add: addDocumentAlternativeTitle,
        update: updateDocumentAlternativeTitle,
        delete: deleteDocumentAlternativeTitle
    },
    alternativeAbstract:{
        add: addDocumentAlternativeAbstract,
        update: updateDocumentAlternativeAbstract,
        delete: deleteDocumentAlternativeAbstract
    },
    ...chapterAPIs
};