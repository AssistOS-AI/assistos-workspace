const enclave = require("opendsu").loadAPI("enclave");
const Loader = require('../../index.js');
const utilsModule = Loader.loadModule('util');
const crypto = utilsModule.loadAPIs('crypto');
const constants = Loader.loadModule('constants');
const chapterAPIs = require('./chapter.js');

function splitObjectId(objectId){
    let splitId = objectId.split(".");
    return splitId.filter((element, index) => index % 2 !== 0);
}
const objectTypes = constants.OBJECT_TYPES;
function getDocumentComponentRecordPK(key, componentId){
    return key + "#" + componentId;
}
async function getDocument(spaceId, documentId){
    function getRecordDataAndRemove(recordsArray, pk){
        const index = recordsArray.findIndex(item => item.pk === pk);
        if (index !== -1) {
            const record = recordsArray[index];
            recordsArray.splice(index, 1);
            return record.data;
        } else {
            return null;
        }
    }
    function constructObjectArrayAndRemove(recordsArray, objectType){
        const objectsToRemove = recordsArray.filter(record => record.pk.includes(objectType));
        const dataArray = objectsToRemove.map(record => record.data);
        objectsToRemove.forEach(object => {
            const index = recordsArray.indexOf(object);
            if (index !== -1) {
                recordsArray.splice(index, 1);
            }
        });
        return dataArray;
    }
    function constructChaptersAndRemove(recordsArray){
        let chapters = [];
        let chapterRecords = recordsArray.filter(record => record.pk.includes("#chapter#"));
        //remove records from original array
        chapterRecords.forEach(object => {
            const index = recordsArray.indexOf(object);
            if (index !== -1) {
                recordsArray.splice(index, 1);
            }
        });
        const groupedChapters = chapterRecords.reduce((groups, record) => {
            const chapterId = record.pk.split('#')[2];
            if (!groups[chapterId]) {
                groups[chapterId] = [];
            }
            groups[chapterId].push(record);
            return groups;
        }, {});

        for(let key of Object.keys(groupedChapters)){
            let chapterObj = {
                id: key,
                position: getRecordDataAndRemove(groupedChapters[key], objectTypes.chapterMetadata + "#chapter#" + key),
                title: getRecordDataAndRemove(groupedChapters[key], objectTypes.chapterTitle + "#chapter#" + key),
                mainIdeas: constructObjectArrayAndRemove(groupedChapters[key], objectTypes.chapterMainIdea) || [],
                alternativeTitles: constructObjectArrayAndRemove(groupedChapters[key], objectTypes.chapterAlternativeTitle) || [],
                alternativeChapters: constructObjectArrayAndRemove(groupedChapters[key], objectTypes.alternativeChapter) || [],
                paragraphs: constructParagraphsAndRemove(groupedChapters[key], key) || []
            }
            chapters.push(chapterObj);
        }
        chapters.sort((a, b) => a.position - b.position);
        return chapters;
    }
    function constructParagraphsAndRemove(recordsArray, chapterId){
        let paragraphs = [];
        let paragraphRecords = recordsArray.filter(record => record.pk.includes("#paragraph#"));
        const groupedParagraphs = paragraphRecords.reduce((groups, record) => {
            const paragraphId = record.pk.split('#')[4];
            if (!groups[paragraphId]) {
                groups[paragraphId] = [];
            }
            groups[paragraphId].push(record);
            return groups;
        }, {});
        for(let key of Object.keys(groupedParagraphs)){
            let paragraphObj = {
                id: key,
                position: getRecordDataAndRemove(groupedParagraphs[key], objectTypes.paragraphMetadata + "#chapter#" + chapterId + "#paragraph#" + key),
                text: getRecordDataAndRemove(groupedParagraphs[key], objectTypes.paragraphText + "#chapter#" + chapterId + "#paragraph#" + key) || "",
                mainIdea: getRecordDataAndRemove(groupedParagraphs[key], objectTypes.paragraphMainIdea + "#chapter#" + chapterId + "#paragraph#" + key) || "",
                alternativeParagraphs: constructObjectArrayAndRemove(groupedParagraphs[key], objectTypes.alternativeParagraph) || []
            }
            paragraphs.push(paragraphObj);
        }
        paragraphs.sort((a, b) => a.position - b.position);
        return paragraphs;
    }
    function constructDocument(documentId, recordsArray){
        if(!recordsArray || recordsArray.length === 0){
            throw new Error(`No records found for document with id: ${documentId}`);
        }
        try{
            return {
                id: documentId,
                position: getRecordDataAndRemove(recordsArray, objectTypes.documentMetadata),
                title: getRecordDataAndRemove(recordsArray, objectTypes.title),
                topic: getRecordDataAndRemove(recordsArray, objectTypes.topic) || "",
                abstract: getRecordDataAndRemove(recordsArray, objectTypes.abstract) || "",
                mainIdeas: constructObjectArrayAndRemove(recordsArray, objectTypes.mainIdea) || [],
                chapters: constructChaptersAndRemove(recordsArray) || [],
                alternativeTitles: constructObjectArrayAndRemove(recordsArray, objectTypes.alternativeTitle) || [],
                alternativeAbstracts:  constructObjectArrayAndRemove(recordsArray, objectTypes.alternativeAbstract) || []
            }
        } catch (e) {
            throw new Error(`Error constructing document with id ${documentId}: ${e}`);
        }
    }
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let documentRecords = await $$.promisify(lightDBEnclaveClient.getAllRecords)($$.SYSTEM_IDENTIFIER, documentId);
    return constructDocument(documentId, documentRecords);
}
async function addDocument(spaceId, documentData, isUpdate = false) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let documentId;
    if(isUpdate){
        documentId = documentData.id;
    }else{
        documentId = crypto.generateId();
    }

    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, constants.DB_NAMES.DOCUMENTS, documentId, {data:documentId});
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
            chapters.push(await chapterAPIs.chapter.add(spaceId, chapterObj, isUpdate));
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
    await deleteDocument(spaceId, documentId);
    await addDocument(spaceId, documentData, true);
    return documentId;
}
async function deleteDocument(spaceId, documentId) {
    // TODO
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, constants.DB_NAMES.DOCUMENTS, documentId);
    return documentId;
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
    let mainIdeaId = crypto.generateId();
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
    let alternativeTitleId = crypto.generateId();
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
    let alternativeAbstractId = crypto.generateId();
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
        get: getDocument,
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