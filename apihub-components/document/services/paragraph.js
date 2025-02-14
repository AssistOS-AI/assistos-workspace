const lightDB = require('../../apihub-component-utils/lightDB.js');
const TaskManager = require('../../tasks/TaskManager');
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
const documentService = require('./document.js');
function constructParagraphURI(pathSegments) {
    let paragraphURI = "";
    if (pathSegments.documentId) {
        paragraphURI += `${pathSegments.documentId}/`
    }
    if (pathSegments.chapterId) {
        paragraphURI += `${pathSegments.chapterId}/`
    }
    if (pathSegments.paragraphId) {
        paragraphURI += `${pathSegments.paragraphId}`
    }
    if (pathSegments.property) {
        paragraphURI += `/${pathSegments.property}`
    }
    return paragraphURI;
}

async function getParagraphTasks(spaceId, documentId, paragraphId) {
    const paragraphCommands = await getParagraph(spaceId, documentId, paragraphId, {fields: "commands"});
    const paragraphCommandsValues = Object.values(paragraphCommands)
    return paragraphCommandsValues.reduce((acc, command) => {
        if (command.taskId) {
            acc.push(command.taskId);
        }
        return acc;
    }, []);
}

async function deleteParagraphTasks(spaceId, documentId, paragraphId) {
    const paragraphTasks = await getParagraphTasks(spaceId, documentId, paragraphId);
    await Promise.allSettled(paragraphTasks.map(async taskId => {
        return TaskManager.cancelTaskAndRemove(taskId);
    }))
}

async function deleteParagraph(spaceId, documentId, chapterId, paragraphId) {
    await deleteParagraphTasks(spaceId, documentId, paragraphId);
    let objectURI = constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: paragraphId
    });
    let paragraph = await getParagraph(spaceId, documentId, paragraphId, {});
    let chapterRecord = await lightDB.getRecord(spaceId, documentId, chapterId);
    let position = chapterRecord.data.paragraphs.findIndex(id => id === paragraphId);
    paragraph.position = position;
    await documentService.addOperation(spaceId, documentId, {
        type: "delete",
        objectURI: objectURI,
        data: paragraph,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(documentId, chapterId),
            eventData: {
                position: position,
                paragraphId: paragraphId
            }
        }
    });
    return await lightDB.deleteEmbeddedObject(spaceId, objectURI);
}

async function getParagraph(spaceId, documentId, paragraphId, queryParams) {
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
            documentId: documentId,
            paragraphId: paragraphId
        }))
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            let paragraphSegments = {}
            for (const field of queryParams.fields) {
                paragraphSegments[field] = await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
                    documentId: documentId,
                    paragraphId: paragraphId,
                    property: field
                }))
            }
            return paragraphSegments
        } else {
            return await lightDB.getEmbeddedObject(spaceId, "paragraphs", constructParagraphURI({
                documentId: documentId,
                paragraphId: paragraphId,
                property: queryParams.fields
            }))
        }
    }
}

async function createParagraph(spaceId, documentId, chapterId, paragraphData) {
    let objectURI = constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: "paragraphs"
    });
    let {id, position} = await lightDB.addEmbeddedObject(spaceId, objectURI, paragraphData);
    let deleteObjURI = constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: id
    });
    paragraphData.position = position;
    await documentService.addOperation(spaceId, documentId, {
        type: "add",
        objectURI: deleteObjURI,
        data: paragraphData,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(documentId, chapterId),
            eventData: {
                paragraphId: id,
                position: position
            }
        }
    });
    return {id, position};
}

async function updateParagraph(spaceId, documentId, paragraphId, paragraphData, queryParams) {
    let paragraphURI;
    let oldData;
    if (Object.keys(queryParams).length === 0) {
        paragraphURI = constructParagraphURI({
            documentId: documentId,
            paragraphId: paragraphId
        })
        oldData = await getParagraph(spaceId, documentId, paragraphId, {});
        await lightDB.updateEmbeddedObject(spaceId, paragraphURI, paragraphData);
    } else {
        if (Array.isArray(queryParams.fields)) {
            //TODO check if used
            for (const field of queryParams.fields) {
                await lightDB.updateEmbeddedObject(spaceId, constructParagraphURI({
                    documentId: documentId,
                    paragraphId: paragraphId,
                    property: field
                }), paragraphData[field])
            }
        } else {
            paragraphURI = constructParagraphURI({
                documentId: documentId,
                paragraphId: paragraphId,
                property: queryParams.fields
            });
            oldData = await getParagraph(spaceId, documentId, paragraphId, queryParams);
            await lightDB.updateEmbeddedObject(spaceId, paragraphURI, paragraphData);
        }
    }
    await documentService.addOperation(spaceId, documentId, {
        type: "update",
        objectURI: paragraphURI,
        oldData: oldData,
        newData: paragraphData,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(documentId, paragraphId),
            eventData: queryParams.fields
        }
    });
}

async function swapParagraphs(spaceId, documentId, chapterId, paragraphId, paragraphId2, direction) {
    let paragraphURI = constructParagraphURI({
        documentId: documentId,
        chapterId: chapterId,
        paragraphId: "paragraphs"
    });
    await lightDB.swapEmbeddedObjects(spaceId, paragraphURI, {
        item1: paragraphId,
        item2: paragraphId2
    }, direction);
    await documentService.addOperation(spaceId, documentId, {
        type: "swap",
        objectURI: paragraphURI,
        data: {
            item1: paragraphId,
            item2: paragraphId2
        },
        direction: direction,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(documentId, chapterId),
            eventData: {
                operationType: "swap",
                paragraphId: paragraphId,
                swapParagraphId: paragraphId2,
                direction: direction,
            }
        }
    });
}


module.exports = {
    deleteParagraph,
    getParagraph,
    createParagraph,
    updateParagraph,
    swapParagraphs,
    getParagraphTasks
}
