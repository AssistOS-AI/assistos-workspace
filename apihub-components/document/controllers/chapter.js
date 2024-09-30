const chapterService = require('../services/chapter.js')
const util = require('../../apihub-component-utils/utils.js')
const eventPublisher = require("../../subscribers/eventPublisher");

async function getChapter(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    if (!spaceId || !documentId || !chapterId) {
        return util.sendResponse(res, 400, "application/json", {
            missing: `${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}`,
            success: false
        });
    }
    try {
        const chapter = await chapterService.getChapter(spaceId, documentId, chapterId,req.query);
        return util.sendResponse(res, 200, "application/json", {
            success: true,
            data: chapter
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get chapter" + error.message,
            success: false
        });
    }
}

async function createChapter(req, res) {
    const {spaceId, documentId} = req.params;
    const chapterData = req.body;
    if (!spaceId || !documentId || !chapterData) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterData ? 'request body' : ''}`,
            success: false
        });
    }
    try {
        const chapterId = await chapterService.createChapter(spaceId, documentId, chapterData);
        eventPublisher.notifyClients(req.sessionId, documentId);
        return util.sendResponse(res, 200, "application/json", {
            success: true,
            data: chapterId
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to create chapter" + error.message,
            success: false
        });
    }
}

async function updateChapter(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    const chapterData = req.body;
    if (!spaceId || !documentId || !chapterId || !chapterData) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${chapterData ? 'request body' : ''}`,
            success: false
        });
    }
    try {
        await chapterService.updateChapter(spaceId, documentId, chapterId, chapterData,req.query, req.sessionId);
        return util.sendResponse(res, 200, "application/json", {
            success: true,
            data: "Chapter updated successfully"
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to update chapter" + error.message,
            success: false
        });
    }
}

async function deleteChapter(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    if (!spaceId || !documentId || !chapterId) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}`,
            success: false
        });
    }
    try {
        await chapterService.deleteChapter(spaceId, documentId, chapterId);
        eventPublisher.notifyClients(req.sessionId, chapterId, "delete")
        eventPublisher.notifyClients(req.sessionId, documentId)
        return util.sendResponse(res, 200, "application/json", {
            success: true,
            data: "Chapter deleted successfully"
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete chapter" + error.message,
            success: false
        });
    }
}
async function swapChapters(req, res) {
    const {spaceId, documentId, chapterId1, chapterId2} = req.params;
    if (!spaceId || !documentId || !chapterId1 || !chapterId2) {
        return util.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId1 ? 'chapterId1 ' : ''}${chapterId2 ? 'chapterId2 ' : ''}`,
            success: false
        });
    }
    try {
        await chapterService.swapChapters(spaceId, documentId, chapterId1, chapterId2);
        eventPublisher.notifyClients(req.sessionId, documentId)
        return util.sendResponse(res, 200, "application/json", {
            success: true,
            data: "Chapters swapped successfully"
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to swap chapters" + error.message,
            success: false
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
