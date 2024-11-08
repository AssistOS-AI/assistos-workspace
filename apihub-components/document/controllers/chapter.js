const chapterService = require('../services/chapter.js')
const util = require('../../apihub-component-utils/utils.js')
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
async function getChapter(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    if (!spaceId || !documentId || !chapterId) {
        return util.sendResponse(res, 400, "application/json", {
            missing: `${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}`,
        });
    }
    try {
        const chapter = await chapterService.getChapter(spaceId, documentId, chapterId,req.query);
        return util.sendResponse(res, 200, "application/json", {
            data: chapter
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get chapter" + error.message,
        });
    }
}

async function createChapter(req, res) {
    const {spaceId, documentId} = req.params;
    const chapterData = req.body;
    if (!spaceId || !documentId || !chapterData) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterData ? 'request body' : ''}`,
        });
    }
    try {
        const {id, position} = await chapterService.createChapter(spaceId, documentId, chapterData);
        let objectId = SubscriptionManager.getObjectId(spaceId, documentId);
        let eventData = {
            operationType: "add",
            chapterId: id,
            position: position
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return util.sendResponse(res, 200, "application/json", {
            data: id
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to create chapter" + error.message,
        });
    }
}

async function updateChapter(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    const chapterData = req.body;
    if (!spaceId || !documentId || !chapterId ) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}`,
        });
    }
    try {
        await chapterService.updateChapter(spaceId, documentId, chapterId, chapterData, req.query, req.sessionId);
        let objectId = SubscriptionManager.getObjectId(documentId, chapterId);
        SubscriptionManager.notifyClients(req.sessionId, objectId, req.query.fields);
        return util.sendResponse(res, 200, "application/json", {
            data: "Chapter updated successfully"
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to update chapter" + error.message,
        });
    }
}

async function deleteChapter(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    if (!spaceId || !documentId || !chapterId) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}`,
        });
    }
    try {
        await chapterService.deleteChapter(spaceId, documentId, chapterId);
        let objectId = SubscriptionManager.getObjectId(spaceId, documentId);
        let eventData = {
            operationType: "delete",
            chapterId: chapterId
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return util.sendResponse(res, 200, "application/json", {
            data: "Chapter deleted successfully"
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete chapter" + error.message,
        });
    }
}
async function swapChapters(req, res) {
    const {spaceId, documentId, chapterId1, chapterId2} = req.params;
    if (!spaceId || !documentId || !chapterId1 || !chapterId2) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId1 ? 'chapterId1 ' : ''}${chapterId2 ? 'chapterId2 ' : ''}`,
        });
    }
    let direction = req.body.direction;
    try {
        await chapterService.swapChapters(spaceId, documentId, chapterId1, chapterId2, direction);
        let objectId = SubscriptionManager.getObjectId(spaceId, documentId);
        let eventData = {
            operationType: "swap",
            chapterId: chapterId1,
            swapChapterId: chapterId2,
            direction: direction
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return util.sendResponse(res, 200, "application/json", {
            data: "Chapters swapped successfully"
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to swap chapters" + error.message,
        });
    }
}

module.exports = {
    getChapter,
    createChapter,
    updateChapter,
    deleteChapter,
    swapChapters
}
