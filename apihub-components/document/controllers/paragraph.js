const utils = require('../../apihub-component-utils/utils.js');
const paragraphService = require('../services/paragraph.js');
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
const crypto = require('../../apihub-component-utils/crypto.js');
async function getParagraph(req, res) {
    const {spaceId, documentId, paragraphId} = req.params;
    if (!spaceId || !documentId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            missing: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${paragraphId ? 'paragraphId ' : ''}`,
        });
    }
    try {
        const paragraph = await paragraphService.getParagraph(spaceId, documentId, paragraphId,req.query);
        return utils.sendResponse(res, 200, "application/json", {
            data: paragraph
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to get paragraph" + error.message,
        });
    }
}

async function createParagraph(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    const paragraphData = req.body;
    if (!spaceId || !documentId || !chapterId || !paragraphData) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${paragraphData ? 'request body' : ''}`,
        });
    }
    try {
        const {id, position} = await paragraphService.createParagraph(spaceId, documentId, chapterId, paragraphData);
        let objectId = SubscriptionManager.getObjectId(documentId, chapterId);
        let eventData = {
            operationType: "add",
            paragraphId: id,
            position: position
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {
            data: id
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to create paragraph" + error.message,
        });
    }
}

async function updateParagraph(req, res) {
    const {spaceId, documentId, paragraphId} = req.params;
    const paragraphData = req.body;
    if (!spaceId || !documentId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${paragraphId ? 'paragraphId ' : ''}${paragraphData ? 'request body' : ''}`,
        });
    }
    try {
        await paragraphService.updateParagraph(spaceId, documentId, paragraphId, paragraphData,req.query);
        let objectId = SubscriptionManager.getObjectId(documentId, paragraphId);
        SubscriptionManager.notifyClients(req.sessionId, objectId, req.query.fields);
        return utils.sendResponse(res, 200, "application/json", {
            message: "Paragraph updated successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to update paragraph" + error.message,
        });
    }
}

async function deleteParagraph(req, res) {
    const {spaceId, documentId, chapterId, paragraphId} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${paragraphId ? 'paragraphId ' : ''}`,
        });
    }
    try {
        await paragraphService.deleteParagraph(spaceId, documentId, chapterId, paragraphId);
        let objectId = SubscriptionManager.getObjectId(documentId, chapterId);
        let eventData = {
            operationType: "delete",
            paragraphId: paragraphId
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        SubscriptionManager.notifyClients(req.sessionId, documentId,"/tasks");
        return utils.sendResponse(res, 200, "application/json", {
            message: "Paragraph deleted successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to delete paragraph" + error.message,
        });
    }
}
async function swapParagraphs(req, res) {
    const {spaceId, documentId, chapterId, paragraphId1, paragraphId2} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId1 || !paragraphId2) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request" + `Missing ${spaceId ? 'spaceId ' : ''}${documentId ? 'documentId ' : ''}${chapterId ? 'chapterId ' : ''}${paragraphId1 ? 'paragraphId1 ' : ''}${paragraphId2 ? 'paragraphId2 ' : ''}`,
        });
    }
    let direction = req.body.direction;
    try {
        await paragraphService.swapParagraphs(spaceId, documentId, chapterId, paragraphId1, paragraphId2, direction);
        let objectId = SubscriptionManager.getObjectId(documentId, chapterId);
        let eventData = {
            operationType: "swap",
            paragraphId: paragraphId1,
            swapParagraphId: paragraphId2,
            direction: direction
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {
            message: "Paragraphs swapped successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: "Failed to swap paragraphs" + error.message,
        });
    }
}

module.exports = {
    getParagraph,
    createParagraph,
    updateParagraph,
    deleteParagraph,
    swapParagraphs,
}
