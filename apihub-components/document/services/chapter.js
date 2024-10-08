const lightDB = require('../../apihub-component-utils/lightDB.js');
const paragraphService = require('../services/paragraph.js');
const TaskManager = require('../../tasks/TaskManager');

function constructChapterURI(documentId, chapterId, property) {
    return `${documentId}/${chapterId}${property ? `/${property}` : ''}`
}
async function getChapterParagraphIds(spaceId, documentId, chapterId) {
    return await getChapter(spaceId, documentId, chapterId, {fields: "paragraphs"});
}
async function getChapterTasks(spaceId, documentId, chapterId) {
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
    return await lightDB.deleteEmbeddedObject(spaceId, constructChapterURI(documentId, chapterId))
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
    return await lightDB.addEmbeddedObject(spaceId, "chapters", constructChapterURI(documentId, "chapters"), chapterData)
}

async function updateChapter(spaceId, documentId, chapterId, chapterData, queryParams, sessionId) {
    if (Object.keys(queryParams).length === 0) {
        return await lightDB.updateEmbeddedObject(spaceId, constructChapterURI(documentId, chapterId), chapterData, sessionId)
    }
    if (queryParams.fields) {
        if (Array.isArray(queryParams.fields)) {
            for (const field of queryParams.fields) {
                await lightDB.updateEmbeddedObject(spaceId, constructChapterURI(documentId, chapterId, field), chapterData[field])
            }
        } else {
            return await lightDB.updateEmbeddedObject(spaceId, constructChapterURI(documentId, chapterId, queryParams.fields), chapterData)
        }
    }
}

async function swapChapters(spaceId, documentId, chapterId1, chapterId2) {
    return await lightDB.swapEmbeddedObjects(spaceId, constructChapterURI(documentId, "chapters"),{
        item1: chapterId1,
        item2: chapterId2
    } )
}


module.exports = {
    getChapter,
    createChapter,
    updateChapter,
    deleteChapter,
    swapChapters,
    getChapterTasks
}
