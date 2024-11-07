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
    if (!spaceId || !documentId || !paragraphId || !paragraphData) {
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

let selectedParagraphs = {};
function getSelectedParagraphs(req, res) {
    try {
        let spaceId = req.params.spaceId;
        let documentId = req.params.documentId;
        let otherUsersSelected = {};
        let userId = req.userId;
        for (let [key, value] of Object.entries(selectedParagraphs)) {
            if(key.startsWith(`${spaceId}/${documentId}`)){
                if(value.users.find((selection) => selection.userId === userId)){
                    continue;
                }
                let paragraphId = key.split("/")[2];
                otherUsersSelected[paragraphId] = {
                    lockOwner: value.lockOwner,
                    users: JSON.parse(JSON.stringify(value.users))
                };
            }
        }
        if(otherUsersSelected !== {}){
            for(let paragraphId in otherUsersSelected) {
                otherUsersSelected[paragraphId].users = otherUsersSelected[paragraphId].users.map((selection) => {
                    delete selection.timeoutId;
                    return selection;
                });
            }
        }

        return utils.sendResponse(res, 200, "application/json", {
            data: otherUsersSelected
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }
}
function getParagraphSelectId(spaceId, documentId, paragraphId){
    return `${spaceId}/${documentId}/${paragraphId}`;
}
function setNewSelection(sessionId, selectId, spaceId, documentId, paragraphId, userId, userImageId, lockText) {
    const paragraphSelectId = getParagraphSelectId(spaceId, documentId, paragraphId);
    const timeoutId = setTimeout(() => {
        deleteSelection(paragraphSelectId, selectId, sessionId, documentId, paragraphId);
    }, 1000 * 10);

    let paragraph = selectedParagraphs[paragraphSelectId];
    let lockOwner;

    if (!paragraph) {
        // If paragraph doesn't exist, create a new entry with the initial user
        lockOwner = lockText ? selectId : undefined;
        selectedParagraphs[paragraphSelectId] = {
            lockOwner,
            users: [{
                selectId,
                timeoutId,
                userId,
                userImageId
            }]
        };
    } else {
        // If paragraph exists, check if user selection already exists
        const existingSelection = paragraph.users.find(selection => selection.selectId === selectId);

        if (existingSelection) {
            // Update existing user's timeout
            clearTimeout(existingSelection.timeoutId);
            existingSelection.timeoutId = timeoutId;
        } else {
            // Add new user to paragraph's user list
            paragraph.users.push({
                selectId,
                timeoutId,
                userId,
                userImageId
            });
        }

        // Determine lock owner
        if (!paragraph.lockOwner && lockText) {
            lockOwner = selectId;
            paragraph.lockOwner = lockOwner;
        } else {
            lockOwner = paragraph.lockOwner;
        }
    }

    return lockOwner;
}
function deselectParagraph(req, res) {
    try {
        let paragraphId = req.params.paragraphId;
        let documentId = req.params.documentId;
        let selectId = req.params.selectId;
        let spaceId = req.params.spaceId;
        let paragraphSelectionId = getParagraphSelectId(spaceId, documentId, paragraphId);
        deleteSelection(paragraphSelectionId, selectId, req.sessionId, documentId, paragraphId);
        return utils.sendResponse(res, 200, "application/json", {
        });
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }
}
function selectParagraph(req, res) {
    try {
        let paragraphId = req.params.paragraphId;
        let documentId = req.params.documentId;
        let userId = req.userId;
        let lockText = req.body.lockText;
        let selectId = req.body.selectId;
        let spaceId = req.params.spaceId;

        let lockOwner = setNewSelection(req.sessionId, selectId, spaceId, documentId, paragraphId, userId, "", lockText);
        let objectId = SubscriptionManager.getObjectId(documentId, paragraphId);

        let eventData = {
            selected: true,
            userId: userId,
            selectId: selectId,
            userImageId: "",
            lockOwner: lockOwner
        }
        SubscriptionManager.notifyClients(req.sessionId, objectId, eventData);
        return utils.sendResponse(res, 200, "application/json", {});
    } catch (e) {
        return utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }

}
function deleteSelection(paragraphSelectId, selectId, sessionId, documentId, paragraphId){
    let paragraph = selectedParagraphs[paragraphSelectId];
    if(!paragraph){
        return;
    }
    let userSelection = paragraph.users.find((selection) => selection.selectId === selectId);
    if(!userSelection){
        return;
    }
    let index = paragraph.users.indexOf(userSelection);
    paragraph.users.splice(index, 1);
    let objectId = SubscriptionManager.getObjectId(documentId, paragraphId);
    if(userSelection.selectId === paragraph.lockOwner){
        paragraph.lockOwner = undefined;
    }
    let eventData = {
        selected: false,
        selectId: selectId,
        lockOwner: paragraph.lockOwner
    }
    SubscriptionManager.notifyClients(sessionId, objectId, eventData);
    if(paragraph.users.length === 0){
        delete selectedParagraphs[paragraphSelectId];
    }
}

module.exports = {
    getParagraph,
    createParagraph,
    updateParagraph,
    deleteParagraph,
    swapParagraphs,
    selectParagraph,
    getSelectedParagraphs,
    deselectParagraph
}
