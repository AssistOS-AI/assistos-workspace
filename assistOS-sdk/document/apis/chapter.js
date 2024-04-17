const enclave = require("opendsu").loadAPI("enclave");
const Loader = require('../../index.js');
const utilsModule = Loader.loadModule('util');
const crypto = utilsModule.loadAPIs('crypto');
const constants = Loader.loadModule('constants');
const paragraphAPIs = require('./paragraph.js');
const objectTypes = constants.OBJECT_TYPES;

function splitObjectId(objectId){
    let splitId = objectId.split(".");
    return splitId.filter((element, index) => index % 2 !== 0);
}
function getChapterRecordPK (chapterId, key){
    return key + "#" + "chapter" + "#" + chapterId;
}

function getChapterComponentRecordPK(chapterId, key, componentId){
    return key + "#" + "chapter" + "#" + chapterId + "#" + "item" + "#" + componentId;
}
async function addChapter(spaceId, chapterData, isUpdate = false) {
    let documentId = chapterData.documentId;
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    chapterData = chapterData.chapter;
    let chapterId;
    if(isUpdate){
        chapterId = chapterData.id;
    } else {
        chapterId = crypto.generateId();
    }

    let chapterObj = {
        id: chapterId,
        position: chapterData.position,
        title: chapterData.title || "New Chapter",
        mainIdeas: chapterData.mainIdeas || [],
        alternativeTitles: chapterData.alternativeTitles || [],
        alternativeChapters: chapterData.alternativeChapters || [],
    }
    let paragraphs = [];
    if(chapterData.paragraphs){
        for(let paragraph of chapterData.paragraphs){
            let paragraphObj = {
                documentId: documentId,
                chapterId: chapterId,
                paragraph: paragraph
            }
            paragraphs.push(await paragraphAPIs.paragraph.add(spaceId, paragraphObj, isUpdate));
        }
    }
    chapterObj.paragraphs = paragraphs;

    await insertChapterPosition(lightDBEnclaveClient, documentId, chapterObj);

    let pk = getChapterRecordPK(chapterId, objectTypes.chapterTitle);
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:chapterObj.title});
    for(let mainIdea of chapterObj.mainIdeas){
        let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterMainIdea, mainIdea.id)
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:mainIdea});
    }
    for(let alternativeTitle of chapterObj.alternativeTitles){
        let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterAlternativeTitle, alternativeTitle.id);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeTitle});
    }
    for(let alternativeChapter of chapterObj.alternativeChapters){
        let pk = getChapterComponentRecordPK(chapterId, objectTypes.alternativeChapter, alternativeChapter.id);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeChapter});
    }
    return chapterObj;
}
async function insertChapterPosition(lightDBEnclaveClient, documentId, chapterObj){
    let query = [`pk like ${objectTypes.chapterMetadata}`];
    let chaptersPositions = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, documentId, query);
    chaptersPositions.sort((a, b) => a.data - b.data);
    if(chapterObj.position < chaptersPositions.length) {
        for (let i = chapterObj.position; i < chaptersPositions.length; i++) {
            chaptersPositions[i].data++;
        }
        for(let chapterPosition of chaptersPositions){
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, chapterPosition.pk, {data:chapterPosition.data});
        }
    }
    let metadataPK = getChapterRecordPK(chapterObj.id, objectTypes.chapterMetadata);
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, metadataPK, {data:chapterObj.position});
}
async function deleteChapter(spaceId, objectId) {
    let [documentId, chapterId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let query = [`pk like #chapter#${chapterId}`];
    let chapterRecords = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, documentId, query);
    for(let record of chapterRecords){
        await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, record.pk);
    }
    return objectId;
}
async function updateChapter(spaceId, objectId, chapterData) {
    let [documentId, chapterId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);

    let chapterObj = {
        id: chapterId,
        title: chapterData.title || "New Chapter",
        mainIdeas: chapterData.mainIdeas || [],
        alternativeTitles: chapterData.alternativeTitles || [],
        alternativeChapters: chapterData.alternativeChapters || [],
        paragraphs: chapterData.paragraphs || []
    }
    for(let paragraph of chapterData.paragraphs){
        await paragraphAPIs.paragraph.update(spaceId, documentId, chapterId, paragraph);
    }
    let pk = getChapterRecordPK(chapterId, objectTypes.chapterTitle);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:chapterObj.title});
    for(let mainIdea of chapterObj.mainIdeas){
        let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterMainIdea, mainIdea.id)
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:mainIdea});
    }
    for(let alternativeTitle of chapterObj.alternativeTitles){
        let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterAlternativeTitle, alternativeTitle.id);
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeTitle});
    }
    for(let alternativeChapter of chapterObj.alternativeChapters){
        let pk = getChapterComponentRecordPK(chapterId, objectTypes.alternativeChapter, alternativeChapter.id);
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeChapter});
    }
    return objectId;
}
async function swapChapters(spaceId, objectId, chapterId2){
    let [documentId, chapterId1] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let chapter1Position = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, documentId, getChapterRecordPK(chapterId1, objectTypes.chapterMetadata));
    let chapter2Position = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, documentId, getChapterRecordPK(chapterId2, objectTypes.chapterMetadata));
    let temp = chapter1Position.data;
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, getChapterRecordPK(chapterId1, objectTypes.chapterMetadata), {data:chapter2Position.data});
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, getChapterRecordPK(chapterId2, objectTypes.chapterMetadata), {data:temp});
    return objectId;
}
async function updateChapterTitle(spaceId, objectId, title) {
    let [documentId, chapterId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterRecordPK(chapterId, objectTypes.chapterTitle);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:title});
    return objectId;
}
//mainIdeas
async function addChapterMainIdea(spaceId, objectData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let mainIdeaId = crypto.generateId();
    let pk = getChapterComponentRecordPK(objectData.chapterId, objectTypes.chapterMainIdea, mainIdeaId);
    let mainIdeaObj = {
        id: mainIdeaId,
        text: objectData.mainIdea
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectData.documentId, pk, {data:mainIdeaObj});
    return mainIdeaObj;
}
async function updateChapterMainIdea(spaceId, objectId, mainIdea) {
    let [documentId, chapterId, mainIdeaId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterMainIdea, mainIdeaId);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:mainIdea});
    return objectId;
}
async function deleteChapterMainIdea(spaceId, objectId) {
    let [documentId, chapterId, mainIdeaId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterMainIdea, mainIdeaId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
//alternativeTitles
async function addChapterAlternativeTitle(spaceId, objectData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let alternativeTitleId = crypto.generateId();
    let pk = getChapterComponentRecordPK(objectData.chapterId, objectTypes.chapterAlternativeTitle, alternativeTitleId);
    let alternativeTitleObj = {
        id: alternativeTitleId,
        text: objectData.alternativeTitle
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectData.documentId, pk, {data:alternativeTitleObj});
    return alternativeTitleObj;
}
async function updateChapterAlternativeTitle(spaceId, objectId, alternativeTitle) {
    let [documentId, chapterId, alternativeTitleId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterAlternativeTitle, alternativeTitleId);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeTitle});
    return objectId;
}
async function deleteChapterAlternativeTitle(spaceId, objectId) {
    let [documentId, chapterId, alternativeTitleId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterComponentRecordPK(chapterId, objectTypes.chapterAlternativeTitle, alternativeTitleId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
//alternativeChapters
async function addAlternativeChapter(spaceId, objectData) {
    let documentId = objectData.documentId;
    objectData = objectData.alternativeChapter;
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let alternativeChapterId = crypto.generateId();
    let pk = getChapterComponentRecordPK(objectData.chapterId, objectTypes.alternativeChapter, alternativeChapterId);
    let alternativeChapterObj = {
        id: alternativeChapterId,
        title: objectData.title || "New Chapter",
        mainIdeas: objectData.mainIdeas || [],
        paragraphs: objectData.paragraphs || []
    }
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeChapterObj});
    return alternativeChapterObj;
}
async function updateAlternativeChapter(spaceId, objectId, alternativeChapter) {
    let [documentId, chapterId, alternativeChapterId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterComponentRecordPK(chapterId, objectTypes.alternativeChapter, alternativeChapterId);
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeChapter});
    return objectId;
}
async function deleteAlternativeChapter(spaceId, objectId) {
    let [documentId, chapterId, alternativeChapterId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getChapterComponentRecordPK(chapterId, objectTypes.alternativeChapter, alternativeChapterId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
module.exports = {
    chapter:{
        add:addChapter,
        delete:deleteChapter,
        update:updateChapter
    },
    chapterMetadata:{
        update: swapChapters
    },
    chapterTitle:{
        update: updateChapterTitle,
    },
    chapterMainIdea:{
        add: addChapterMainIdea,
        update: updateChapterMainIdea,
        delete: deleteChapterMainIdea
    },
    chapterAlternativeTitle:{
        add: addChapterAlternativeTitle,
        update: updateChapterAlternativeTitle,
        delete: deleteChapterAlternativeTitle
    },
    alternativeChapter:{
        add: addAlternativeChapter,
        update: updateAlternativeChapter,
        delete: deleteAlternativeChapter
    },
    ...paragraphAPIs
}