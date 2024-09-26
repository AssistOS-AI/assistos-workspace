const utils = require('../../apihub-component-utils/utils.js');
const paragraphService = require('../services/paragraph.js');

async function getParagraph(req, res) {
    const {spaceId, documentId, chapterId, paragraphId} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request",
            success: false
        });
    }
    try {
        const paragraph = await paragraphService.getParagraph(spaceId, documentId, chapterId, paragraphId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: paragraph
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: error.message || "Failed to retrieve paragraph",
            success: false
        });
    }
}

async function createParagraph(req, res) {
    const {spaceId, documentId, chapterId} = req.params;
    if (!spaceId || !documentId || !chapterId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request",
            success: false
        });
    }
    try {
        const paragraphId = await paragraphService.createParagraph(spaceId, documentId, chapterId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            data: paragraphId
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: error.message || "Failed to create paragraph",
            success: false
        });
    }
}

async function updateParagraph(req, res) {
    const {spaceId, documentId, chapterId, paragraphId} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request",
            success: false
        });
    }
    try {
        await paragraphService.updateParagraph(spaceId, documentId, chapterId, paragraphId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: "Paragraph updated successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: error.message || "Failed to update paragraph",
            success: false
        });
    }
}

async function deleteParagraph(req, res) {
    const {spaceId, documentId, chapterId, paragraphId} = req.params;
    if (!spaceId || !documentId || !chapterId || !paragraphId) {
        return utils.sendResponse(res, 400, "application/json", {
            message: "Invalid request",
            success: false
        });
    }
    try {
        await paragraphService.deleteParagraph(spaceId, documentId, chapterId, paragraphId);
        return utils.sendResponse(res, 200, "application/json", {
            success: true,
            message: "Paragraph deleted successfully"
        });
    } catch (error) {
        return utils.sendResponse(res, error.statusCode || 500, "application/json", {
            message: error.message || "Failed to delete paragraph",
            success: false
        });
    }
}

module.exports = {
    getParagraph,
    createParagraph,
    updateParagraph,
    deleteParagraph
}
