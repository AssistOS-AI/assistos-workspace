const utils = require('../../apihub-component-utils/utils.js');
const paragraphService = require('../services/paragraph.js');
const SubscriptionManager = require("../../subscribers/SubscriptionManager");
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
        const {id, position} = await paragraphService.createParagraph(spaceId, documentId, chapterId, paragraphData);
        let objectId = SubscriptionManager.getObjectId(documentId, chapterId);
        let eventData = {
            operationType: "add",
            paragraphId: id,
            position: position
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: id
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
        let objectId = SubscriptionManager.getObjectId(documentId, paragraphId);
        SubscriptionManager.notifyClients(req.sessionId, objectId, req.query.fields);
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
        let objectId = SubscriptionManager.getObjectId(documentId, chapterId);
        let eventData = {
            operationType: "delete",
            paragraphId: paragraphId
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        SubscriptionManager.notifyClients(req.sessionId, documentId,"/tasks");
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
let selectedParagraphs = new Map();
function getSelectedParagraphs(req, res) {
    try {
        let spaceId = req.params.spaceId;
        let documentId = req.params.documentId;

        let selected = [];
        for (let [key, value] of selectedParagraphs) {
            if(value.spaceId === spaceId && value.documentId === documentId){
                selected.push(value);
            }
        }
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: selected
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
function selectParagraph(req, res) {
    try {
        let paragraphId = req.params.paragraphId;
        let documentId = req.params.documentId;
        let userId = req.userId;
        let sessionId = req.sessionId;
        if(selectedParagraphs.has(sessionId)){
            return utils.sendResponse(res, 200, "application/json", {
                success: true
            });
        }
        selectedParagraphs.set(sessionId, {
            spaceId: req.params.spaceId,
            documentId: documentId,
            paragraphId: paragraphId,
            userId: userId,
            userImageId: ""
        });
        let objectId = SubscriptionManager.getObjectId(documentId, paragraphId);
        let eventData = {
            selected: true,
            userId: userId,
            userImageId: ""
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {
            success: true
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            success: false,
            message: e.message
        });
    }

}
function deselectParagraph(req, res) {
    try {
        let paragraphId = req.params.paragraphId;
        let documentId = req.params.documentId;
        let sessionId = req.sessionId;
        let userId = req.userId;
        selectedParagraphs.delete(sessionId);

        let objectId = SubscriptionManager.getObjectId(documentId, paragraphId);
        let eventData = {
            selected: false,
            userId: userId,
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {
            success: true
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
module.exports = {
    getParagraph,
    createParagraph,
    updateParagraph,
    deleteParagraph,
    swapParagraphs,
    selectParagraph,
    deselectParagraph,
    getSelectedParagraphs
}
