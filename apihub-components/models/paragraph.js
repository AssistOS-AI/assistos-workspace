const enclave = require("opendsu").loadAPI("enclave");
const Loader = require('../../Loader.js');
const utilsModule = Loader.loadModule('util');
const crypto = utilsModule.loadAPIs('crypto');
const constants = Loader.loadModule('constants');
const objectTypes = constants.OBJECT_TYPES;

function getParagraphRecordPK(chapterId, paragraphId, key){
    return key + "#" + "chapter" + "#" + chapterId + "#" + "paragraph" + "#" + paragraphId;
}

function getParagraphComponentRecordPK(chapterId, paragraphId, key, componentId){
    return key + "#" + "chapter" + "#" + chapterId + "#" + "paragraph" + "#" + paragraphId + "#" + "item" + "#" + componentId;
}

function splitObjectId(objectId){
    let splitId = objectId.split(".");
    return splitId.filter((element, index) => index % 2 !== 0);
}
async function addParagraph(spaceId, paragraphData, isUpdate = false) {
    let documentId = paragraphData.documentId;
    let chapterId = paragraphData.chapterId;
    paragraphData = paragraphData.paragraph;
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let paragraphId;
    if(isUpdate){
       paragraphId = paragraphData.id;
    } else{
        paragraphId = crypto.generateId();
    }

    let paragraphObj = {
        id: paragraphId,
        position: paragraphData.position,
        text: paragraphData.text || "New Paragraph",
        mainIdea: paragraphData.mainIdea || "",
        alternativeParagraphs: paragraphData.alternativeParagraphs || []
    }
    let query = [`pk like ${objectTypes.paragraphMetadata}#chapter#${chapterId}#`];
    let paragraphsPositions = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, documentId, query);
    paragraphsPositions.sort((a, b) => a.data - b.data);
    if(paragraphObj.position < paragraphsPositions.length) {
        for (let i = paragraphObj.position; i < paragraphsPositions.length; i++) {
            paragraphsPositions[i].data++;
        }
        for(let paragraphPosition of paragraphsPositions){
            await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, paragraphPosition.pk, {data:paragraphPosition.data});
        }
    }


    let metadataPK = getParagraphRecordPK(chapterId, paragraphId, objectTypes.paragraphMetadata);
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, metadataPK, {data:paragraphObj.position});

    let textPK = getParagraphRecordPK(chapterId, paragraphId, objectTypes.paragraphText)
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, textPK, {data:paragraphObj.text});

    let pk = getParagraphRecordPK(chapterId, paragraphId, objectTypes.paragraphMainIdea)
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:paragraphObj.mainIdea});

    for(let alternativeParagraph of paragraphObj.alternativeParagraphs){
        let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.alternativeParagraph, alternativeParagraph.id);
        await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeParagraph});
    }
    return paragraphObj;
}

async function updateParagraph(spaceId, objectId, paragraphData) {
    let [documentId, chapterId, paragraphId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let paragraphObj = {
        id: paragraphId,
        text: paragraphData.text,
        mainIdea: paragraphData.mainIdea,
        alternativeParagraphs: paragraphData.alternativeParagraphs || []
    }
    let textPK = getParagraphRecordPK(chapterId, paragraphId, objectTypes.paragraphText)
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, textPK, {data:paragraphObj.text});

    let pk = getParagraphRecordPK(chapterId, paragraphId, objectTypes.paragraphMainIdea)
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:paragraphObj.mainIdea});

    for(let alternativeParagraph of paragraphObj.alternativeParagraphs){
        let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.alternativeParagraph, alternativeParagraph.id);
        await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeParagraph});
    }
    return objectId;
}
async function deleteParagraph(spaceId, objectId) {
    let [documentId, chapterId, paragraphId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let query = [`pk like #chapter#${chapterId}#paragraph#${paragraphId}`];
    let paragraphRecords = await $$.promisify(lightDBEnclaveClient.filter)($$.SYSTEM_IDENTIFIER, documentId, query);
    for(let record of paragraphRecords){
        await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, record.pk);
    }
    return objectId;
}
async function swapParagraphs(spaceId, objectId, paragraphId2){
    let [documentId, chapterId, paragraphId1] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let paragraph1Position = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, documentId, getParagraphRecordPK(chapterId, paragraphId1, objectTypes.paragraphMetadata));
    let paragraph2Position = await $$.promisify(lightDBEnclaveClient.getRecord)($$.SYSTEM_IDENTIFIER, documentId, getParagraphRecordPK(chapterId, paragraphId2, objectTypes.paragraphMetadata));
    let temp = paragraph1Position.data;
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, getParagraphRecordPK(chapterId, paragraphId1, objectTypes.paragraphMetadata), {data:paragraph2Position.data});
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, getParagraphRecordPK(chapterId, paragraphId2, objectTypes.paragraphMetadata), {data:temp});
    return objectId;
}
async function updateParagraphText(spaceId, objectId, text) {
    let [documentId, chapterId, paragraphId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getParagraphRecordPK(chapterId, paragraphId, objectTypes.paragraphText)
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:text});
    return objectId;
}
async function addParagraphMainIdea(spaceId, objectData) {
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let mainIdeaId = crypto.generateId();
    let mainIdeaObj = {
        id: mainIdeaId,
        text: objectData.mainIdea
    }
    let pk = getParagraphComponentRecordPK(objectData.chapterId, objectData.paragraphId, objectTypes.paragraphMainIdea, mainIdeaId)
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, objectData.documentId, pk, {data:mainIdeaObj});
    return mainIdeaObj;
}
async function updateParagraphMainIdea(spaceId, objectId, mainIdea) {
    let [documentId, chapterId, paragraphId, mainIdeaId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.paragraphMainIdea, mainIdeaId)
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:mainIdea});
    return objectId;
}
async function deleteParagraphMainIdea(spaceId, objectId) {
    let [documentId, chapterId, paragraphId, mainIdeaId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.paragraphMainIdea, mainIdeaId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
async function addAlternativeParagraph(spaceId, objectData) {
    let documentId = objectData.documentId;
    let chapterId = objectData.chapterId;
    let paragraphId = objectData.paragraphId;
    objectData = objectData.alternativeParagraph;
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let alternativeParagraphId = crypto.generateId();
    let paragraphObj = {
        id: alternativeParagraphId,
        text: objectData.text || "",
        mainIdea: objectData.mainIdea || "",
    }
    let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.alternativeParagraph, alternativeParagraphId)
    await $$.promisify(lightDBEnclaveClient.insertRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:paragraphObj});
    return paragraphObj;
}
async function updateAlternativeParagraph(spaceId, objectId, alternativeParagraph) {
    let [documentId, chapterId, paragraphId, alternativeParagraphId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.alternativeParagraph, alternativeParagraphId)
    await $$.promisify(lightDBEnclaveClient.updateRecord)($$.SYSTEM_IDENTIFIER, documentId, pk, {data:alternativeParagraph});
    return objectId;
}
async function deleteAlternativeParagraph(spaceId, objectId) {
    let [documentId, chapterId, paragraphId, alternativeParagraphId] = splitObjectId(objectId);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    let pk = getParagraphComponentRecordPK(chapterId, paragraphId, objectTypes.alternativeParagraph, alternativeParagraphId);
    await $$.promisify(lightDBEnclaveClient.deleteRecord)($$.SYSTEM_IDENTIFIER, documentId, pk);
    return objectId;
}
module.exports = {
    paragraph:{
        add: addParagraph,
        update: updateParagraph,
        delete: deleteParagraph
    },
    paragraphMetadata:{
        update: swapParagraphs
    },
    paragraphText:{
        update: updateParagraphText
    },
    paragraphMainIdea:{
        add: addParagraphMainIdea,
        update: updateParagraphMainIdea,
        delete: deleteParagraphMainIdea
    },
    alternativeParagraph:{
        add: addAlternativeParagraph,
        update: updateAlternativeParagraph,
        delete: deleteAlternativeParagraph
    }
}