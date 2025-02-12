const lightDB = require('../../apihub-component-utils/lightDB.js');
const TaskManager = require('../../tasks/TaskManager');
const documentService = require('./document.js');
const SubscriptionManager = require("../../subscribers/SubscriptionManager");

function constructChapterURI(documentId, chapterId, property) {
    return `${documentId}/${chapterId}${property ? `/${property}` : ''}`
}
async function getChapterParagraphIds(spaceId, documentId, chapterId) {
    const chapterParagraphs=await getChapter(spaceId, documentId, chapterId, {fields: "paragraphs"});
    return chapterParagraphs.map(paragraph => paragraph.id);
}
async function getChapterTasks(spaceId, documentId, chapterId) {
    const paragraphService = require('../services/paragraph.js');
    const chapterParagraphIds = await getChapterParagraphIds(spaceId, documentId, chapterId);
    const paragraphTasks = await Promise.allSettled(chapterParagraphIds.map(paragraphId => {
        return paragraphService.getParagraphTasks(spaceId, documentId, paragraphId);
    }));
    return paragraphTasks
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();
}

async function deleteChapter(spaceId, documentId, chapterId) {
    const chapterTasks = await getChapterTasks(spaceId, documentId, chapterId);
    await Promise.allSettled(chapterTasks.map(async taskId => {
        return TaskManager.cancelTaskAndRemove(taskId);
    }));
    let chapterURI = constructChapterURI(documentId, chapterId);
    let chapter = await getChapter(spaceId, documentId, chapterId, {});
    let documentRecord = await lightDB.getRecord(spaceId, documentId, documentId);
    let position = documentRecord.data.chapters.findIndex(id => id === chapterId);
    chapter.position = position;
    await documentService.addOperation(spaceId, documentId, {
        type: "delete",
        objectURI: chapterURI,
        data: chapter,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(spaceId, documentId),
            eventData: {
                position: position,
                chapterId: chapterId
            }
        }
    });
    return await lightDB.deleteEmbeddedObject(spaceId, chapterURI);
}

async function getChapter(spaceId, documentId, chapterId, queryParams) {
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.getEmbeddedObject(spaceId, "chapters", constructChapterURI(documentId, chapterId))
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            let chapterSegments = {}
            for (const field of queryParams.fields) {
                chapterSegments[field] = await lightDB.getEmbeddedObject(spaceId, "chapters", constructChapterURI(documentId, chapterId, field))
            }
            return chapterSegments
        } else {
            return await lightDB.getEmbeddedObject(spaceId, "chapters", constructChapterURI(documentId, chapterId, queryParams.fields))
        }
    }
}

async function createChapter(spaceId, documentId, chapterData) {
    let {id, position} = await lightDB.addEmbeddedObject(spaceId, constructChapterURI(documentId, "chapters"), chapterData);
    await documentService.addOperation(spaceId, documentId, {
        type: "add",
        objectURI: constructChapterURI(documentId, id),
        data: chapterData,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(spaceId, documentId),
            eventData: {
                chapterId: id,
                position: position
            }
        }
    });
    return {id, position};
}

async function updateChapter(spaceId, documentId, chapterId, chapterData, queryParams, sessionId) {
    let chapterURI;
    let oldData;
    if (Object.keys(queryParams).length === 0) {
        chapterURI = constructChapterURI(documentId, chapterId);
        oldData = await getChapter(spaceId, documentId, chapterId, {});
        await lightDB.updateEmbeddedObject(spaceId, chapterURI, chapterData, sessionId)
    } else if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            for (const field of queryParams.fields) {
                await lightDB.updateEmbeddedObject(spaceId, constructChapterURI(documentId, chapterId, field), chapterData[field])
            }
        } else {
            chapterURI = constructChapterURI(documentId, chapterId, queryParams.fields);
            oldData = await getChapter(spaceId, documentId, chapterId, queryParams);
            await lightDB.updateEmbeddedObject(spaceId, chapterURI, chapterData)
        }
    }
    await documentService.addOperation(spaceId, documentId, {
        type: "update",
        objectURI: chapterURI,
        oldData: oldData,
        newData: chapterData,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(documentId, chapterId),
            eventData: queryParams.fields
        }
    });
}

async function swapChapters(spaceId, documentId, chapterId1, chapterId2, direction) {
    let chapterURI = constructChapterURI(documentId, "chapters");
    await lightDB.swapEmbeddedObjects(spaceId, chapterURI,{
        item1: chapterId1,
        item2: chapterId2
    }, direction)
    await documentService.addOperation(spaceId, documentId, {
        type: "swap",
        objectURI: chapterURI,
        data: {
            item1: chapterId1,
            item2: chapterId2
        },
        direction: direction,
        reverseOpNotification: {
            objectId: SubscriptionManager.getObjectId(spaceId, documentId),
            eventData: {
                operationType: "swap",
                chapterId: chapterId1,
                swapChapterId: chapterId2,
                direction: direction
            }
        }
    });
}


module.exports = {
    getChapter,
    createChapter,
    updateChapter,
    deleteChapter,
    swapChapters,
    getChapterTasks
}
