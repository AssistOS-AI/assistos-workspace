const utils = require('../../apihub-component-utils/utils.js');
const paragraphService = require('../services/paragraph.js');
const eventPublisher = require("../../subscribers/eventPublisher");


async function getParagraph(req, res) {
    const {spaceId, documentId, paragraphId} = req.params;
    if (!spaceId || !documentId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            missing: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${paragraphId ? 'paragraphId ' : ''}`,
            success: false
        });
    }
    try {
        const paragraph = await paragraphService.getParagraph(spaceId, documentId, paragraphId,req.query);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: paragraph
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get paragraph" + error.message,
            success: false
        });
    }
}

async function createParagraph(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    const paragraphData = req.body;
    if (!spaceId || !documentId || !chapterId || !paragraphData) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${paragraphData ? 'request body' : ''}`,
            success: false
        });
    }
    try {
        const paragraphId = await paragraphService.createParagraph(spaceId, documentId, chapterId, paragraphData);
        eventPublisher.notifyClients(req.sessionId, chapterId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: paragraphId
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to create paragraph" + error.message,
            success: false
        });
    }
}

async function updateParagraph(req, res) {
    const {spaceId, documentId, paragraphId} = req.params;
    const paragraphData = req.body;
    if (!spaceId || !documentId || !paragraphId || !paragraphData) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${paragraphId ? 'paragraphId ' : ''}${paragraphData ? 'request body' : ''}`,
            success: false
        });
    }
    try {
        await paragraphService.updateParagraph(spaceId, documentId, paragraphId, paragraphData,req.query);
        eventPublisher.notifyClients(req.sessionId, paragraphId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: "Paragraph updated successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to update paragraph" + error.message,
            success: false
        });
    }
}

async function deleteParagraph(req, res) {
    const {spaceId, documentId, chapterId, paragraphId} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${paragraphId ? 'paragraphId ' : ''}`,
            success: false
        });
    }
    try {
        await paragraphService.deleteParagraph(spaceId, documentId, chapterId, paragraphId);
        eventPublisher.notifyClients(req.sessionId, chapterId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: "Paragraph deleted successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete paragraph" + error.message,
            success: false
        });
    }
}
async function swapParagraphs(req, res) {
    const {spaceId, documentId, chapterId, paragraphId1, paragraphId2} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId1 || !paragraphId2) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${paragraphId1 ? 'paragraphId1 ' : ''}${paragraphId2 ? 'paragraphId2 ' : ''}`,
            success: false
        });
    }
    try {
        await paragraphService.swapParagraphs(spaceId, documentId, chapterId, paragraphId1, paragraphId2);
        eventPublisher.notifyClients(req.sessionId, chapterId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: "Paragraphs swapped successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to swap paragraphs" + error.message,
            success: false
        });
    }
}

module.exports = {
    getParagraph,
    createParagraph,
    updateParagraph,
    deleteParagraph,
    swapParagraphs
}
