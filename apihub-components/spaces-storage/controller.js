require('../../assistos-sdk/build/bundles/assistos_sdk.js');
const utils = require('../apihub-component-utils/utils.js');
const cookie = require('../apihub-component-utils/cookie.js');
const space = require("./space.js");
const user = require("../users-storage/user.js");
const enclave = require("opendsu").loadAPI("enclave");
const crypto = require('../apihub-component-utils/crypto.js');
const fsPromises = require('fs').promises;
const path = require('path');
const SubscriptionManager = require("../subscribers/SubscriptionManager.js");
const {sendResponse} = require("../apihub-component-utils/utils");
const dataVolumePaths = require('../volumeManager').paths;
const Storage = require("../apihub-component-utils/storage.js");
const lightDB = require("../apihub-component-utils/lightDB.js");
const {
    getTextResponse,
    getTextStreamingResponse,
    getImageResponse,
    editImage,
    getImageVariants
} = require('../llms/controller.js');
const fs = require("fs");

function getFileObjectsMetadataPath(spaceId, objectType) {
    return path.join(dataVolumePaths.space, `${spaceId}/${objectType}/metadata.json`);
}

const Busboy = require('busboy');
const unzipper = require('unzipper');


async function getFileObjectsMetadata(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    try {
        let filePath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(filePath, {encoding: 'utf8'}));
        return utils.sendResponse(response, 200, "application/json", {
            data: metadata,
            message: `Objects metadata of type ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at getting objects metadata of type: ${objectType}`
        });
    }
}

function getFileObjectPath(spaceId, objectType, objectId) {
    return path.join(dataVolumePaths.space, `${spaceId}/${objectType}/${objectId}.json`);
}

async function getFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    try {
        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        let data = await fsPromises.readFile(filePath, {encoding: 'utf8'});
        return utils.sendResponse(response, 200, "application/json", {
            data: JSON.parse(data),
            message: `Object with id: ${objectId} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at getting object with id: ${objectId}`
        });
    }
}

async function getFileObjects(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    try {
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        let objects = [];
        for (let item of metadata) {
            let filePath = getFileObjectPath(spaceId, objectType, item.id);
            let object = JSON.parse(await fsPromises.readFile(filePath, {encoding: 'utf8'}));
            objects.push(object);
        }
        return utils.sendResponse(response, 200, "application/json", {
            data: objects,
            message: `Objects of type ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at getting objects of type: ${objectType}`
        });
    }
}

async function addFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;
    let objectId = crypto.generateId();
    try {
        objectData.id = objectId;
        let metaObj = {};
        for (let key of objectData.metadata) {
            metaObj[key] = objectData[key];
        }
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        metadata.push(metaObj);
        await fsPromises.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');

        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        await fsPromises.writeFile(filePath, JSON.stringify(objectData, null, 2), 'utf8');

        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectType));
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));

        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at adding object: ${objectType}`
        });
    }
}

async function updateFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    const objectData = request.body;
    try {
        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        let metaObj = metadata.find(item => item.id === objectId);
        if (metaObj) {
            for (let key of objectData.metadata) {
                metaObj[key] = objectData[key];
            }
            await fsPromises.writeFile(metadataPath, JSON.stringify(metadata), 'utf8');
        } else {
            return utils.sendResponse(response, 500, "application/json", {
                message: `Error at updating object: ${objectId}: metadata not found`
            });
        }
        await fsPromises.writeFile(filePath, JSON.stringify(objectData, null, 2), 'utf8');
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectType));
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectId} updated successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at updating object: ${objectId}`
        });
    }
}

async function deleteFileObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    try {
        let metadataPath = getFileObjectsMetadataPath(spaceId, objectType);
        let metadata = JSON.parse(await fsPromises.readFile(metadataPath, {encoding: 'utf8'}));
        let index = metadata.findIndex(item => item.id === objectId);
        if (index !== -1) {
            metadata.splice(index, 1);
            await fsPromises.writeFile(metadataPath, JSON.stringify(metadata), 'utf8');
        }
        let filePath = getFileObjectPath(spaceId, objectType, objectId);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectType));
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId), "delete");
        await fsPromises.unlink(filePath);
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectId} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at deleting object: ${objectId}`
        });
    }
}

async function getContainerObjectsMetadata(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    try {
        const metadata = await lightDB.getContainerObjectsMetadata(spaceId, objectType);
        return utils.sendResponse(response, 200, "application/json", {
            data: metadata,
            message: `Objects metadata of type ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at getting objects metadata of type: ${objectType}`
        });
    }
}

async function getContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectId = request.params.objectId;
    try {
        let object = await lightDB.getContainerObject(spaceId, objectId);
        return utils.sendResponse(response, 200, "application/json", {
            data: object,
            message: `Object with id: ${objectId} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at getting object with id: ${objectId}`
        });
    }
}

async function addContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;
    try {
        let objectId = await lightDB.addContainerObject(spaceId, objectType, objectData);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectType));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at adding object: ${objectType}`
        });
    }
}

async function updateContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectId = request.params.objectId;
    const objectData = request.body;
    try {
        await lightDB.updateContainerObject(spaceId, objectId, objectData);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectType));
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectId} updated successfully`
        });
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            message: e + ` Error at updating object: ${objectId}`
        });
    }
}

async function deleteContainerObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectId = request.params.objectId;
    try {
        await lightDB.deleteContainerObject(spaceId, objectId);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId), "delete");
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId.split('_')[0]));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectId} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at deleting object: ${objectId}`
        });
    }
}

async function getEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    let objectURI = decodeURIComponent(request.params.objectURI);
    try {
        let embeddedObject = await lightDB.getEmbeddedObject(spaceId, objectType, objectURI);
        return utils.sendResponse(response, 200, "application/json", {
            data: embeddedObject,
            message: `Object ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at loading object: ${objectType}: ${objectURI}`
        });
    }
}

async function addEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectURI = decodeURIComponent(request.params.objectURI);
    const objectData = request.body;
    try {
        let parts = objectURI.split("/");
        let objectId = await lightDB.addEmbeddedObject(spaceId, objectURI, objectData);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, parts[parts.length - 2]));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectId} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at adding object: ${objectURI}`
        });
    }
}

async function updateEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    let objectURI = decodeURIComponent(request.params.objectURI);
    const objectData = request.body;
    try {
        let objectId = await lightDB.updateEmbeddedObject(spaceId, objectURI, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            data: objectId,
            message: `Object ${objectId} updated successfully`
        })
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            message: e + ` Error at updating object: ${objectURI}`
        });
    }
}

async function deleteEmbeddedObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectURI = decodeURIComponent(request.params.objectURI);
    try {
        let parts = objectURI.split("/");
        await lightDB.deleteEmbeddedObject(spaceId, objectURI);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, parts[parts.length - 2]));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectURI,
            message: `Object ${objectURI} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at deleting object: ${objectURI}`
        });
    }
}

async function swapEmbeddedObjects(request, response) {
    const spaceId = request.params.spaceId;
    const objectURI = decodeURIComponent(request.params.objectURI);
    let lightDBEnclaveClient = enclave.initialiseLightDBEnclave(spaceId);
    try {
        let objectId = await lightDBEnclaveClient.swapEmbeddedObjects(spaceId, objectURI, request.body);
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));
        return utils.sendResponse(response, 200, "application/json", {
            data: objectURI,
            message: `Objects from ${objectURI} swapped successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at swapping objects: ${objectURI}`
        });
    }
}

async function addSpaceChatMessage(request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    const userId = request.userId;
    const messageData = request.body;
    try {
        const messageId = await space.APIs.addSpaceChatMessage(spaceId, chatId, userId, "user", messageData);
        utils.sendResponse(response, 200, "application/json", {
            message: `Message added successfully`,
            data: {messageId: messageId}
        });
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, `chat_${spaceId}`));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

async function getSpaceChat(request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    try {
        const chat = await space.APIs.getSpaceChat(spaceId, chatId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Chat loaded successfully`,
            data: chat
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

async function resetSpaceChat(request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    try {
        const chat = await space.APIs.resetSpaceChat(spaceId, chatId);
        return utils.sendResponse(response, 200, "application/json", {
            message: `Chat loaded successfully`,
            data: chat
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

async function saveSpaceChat(request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    try {
        const chat = await space.APIs.storeSpaceChat(spaceId, chatId);
        return utils.sendResponse(response, 200, "application/json", {
            message: `Chat loaded successfully`,
            data: chat
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

/* TODO constant object mapping of content types to avoid writing manually the content type of a response
*   and move the cookie verification authentication, rights, etc in a middleware */
async function getSpace(request, response) {
    try {
        let spaceId;
        const email = request.email;
        if (request.params.spaceId) {
            spaceId = request.params.spaceId;
        } else if (cookie.parseRequestCookies(request).currentSpaceId) {
            spaceId = cookie.parseRequestCookies(request).currentSpaceId;
        } else {
            spaceId = await user.getDefaultSpaceId(email, request.authKey);
        }

        let spaceObject = await space.APIs.getSpaceStatusObject(spaceId);
        //spaceObject.chat = await space.APIs.getSpaceChat(spaceId);
        await user.setUserCurrentSpace(email, spaceId, request.authKey);
        utils.sendResponse(response, 200, "application/json", {
            data: spaceObject,
            message: `Space ${spaceId} loaded successfully`
        }, cookie.createCurrentSpaceCookie(spaceId));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function createSpace(request, response) {
    const userId = request.userId
    const spaceName = request.body.spaceName
    if (!spaceName) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
        });
        return;
    }
    try {
        let SecurityContext = require("assistos").ServerSideSecurityContext;
        let securityContext = new SecurityContext(request);
        const spaceModule = require("assistos").loadModule("space", securityContext);
        let newSpace = await space.APIs.createSpace(spaceName, userId, spaceModule, request.authKey);
        utils.sendResponse(response, 201, "application/json", {
            message: `Space created successfully: ${newSpace.id}`,
            data: newSpace,
        }, cookie.createCurrentSpaceCookie(newSpace.id));
    } catch (error) {
        switch (error.statusCode) {
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: Space already exists",
                });
                return;
            case 401:
                utils.sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid API Key",
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error.message}`,
        });
    }
}

async function deleteSpace(request, response) {
    const spaceId = request.params.spaceId;
    let userId = request.userId;
    try {
        let message = await space.APIs.deleteSpace(userId, spaceId);
        if (!message) {
            //space deleted
            let objectId = SubscriptionManager.getObjectId(spaceId, `space`);
            SubscriptionManager.notifyClients(request.sessionId, objectId, "delete");
        }
        utils.sendResponse(response, 200, "text/plain", message || "");
    } catch (error) {
        utils.sendResponse(response, 500, "text/plain", error.message);
    }
}

async function getSpaceCollaborators(request, response) {
    const spaceId = request.params.spaceId;
    try {
        let collaborators = await space.APIs.getSpaceCollaborators(spaceId, request.authKey);
        utils.sendResponse(response, 200, "application/json", {
            data: collaborators
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function setSpaceCollaboratorRole(request, response) {
    const spaceId = request.params.spaceId;
    const collaboratorId = request.params.collaboratorId;
    const role = request.body.role;
    try {
        let message = await space.APIs.setSpaceCollaboratorRole(request.userId, spaceId, collaboratorId, role);
        utils.sendResponse(response, 200, "application/json", {
            data: message
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function deleteSpaceCollaborator(request, response) {
    const spaceId = request.params.spaceId;
    const collaboratorId = request.params.collaboratorId;
    if (request.userId === collaboratorId) {
        return utils.sendResponse(response, 200, "application/json", {
            data: "You can't delete yourself from the space"
        });
    }
    try {
        let message = await space.APIs.deleteSpaceCollaborator(request.userId, spaceId, collaboratorId);
        utils.sendResponse(response, 200, "application/json", {
            data: message
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

async function addCollaboratorsToSpace(request, response) {
    const userId = request.userId;
    const spaceId = request.params.spaceId;
    const collaborators = request.body.collaborators;

    if (!collaborators) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Collaborator Emails is required",
        });
    }

    try {
        let existingCollaborators = await space.APIs.inviteSpaceCollaborators(userId, spaceId, collaborators);
        utils.sendResponse(response, 200, "application/json", {
            message: `Collaborators invited successfully`,
            data: existingCollaborators
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }

}

async function getAgent(request, response) {
    let agentId = request.params.agentId;
    const spaceId = request.params.spaceId;
    if (!agentId) {
        agentId = await space.APIs.getDefaultSpaceAgentId(spaceId)
    }
    try {
        const agent = await space.APIs.getSpaceAgent(spaceId, agentId)
        utils.sendResponse(response, 200, "application/json", {
            message: "Success retrieving Agent",
            data: agent
        })
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: "Error retrieving Agent",
            data: error.message
        })
    }
}

async function editAPIKey(request, response) {
    const spaceId = request.params.spaceId || cookie.parseRequestCookies(request).currentSpaceId;
    if (!spaceId) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space ID or a valid currentSpaceId cookie is required",
        });
    }
    if (!request.body.type || !request.body.APIKey) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Key Type and API Key are required in the request body",
        });
    }
    const userId = request.userId;
    try {
        await space.APIs.editAPIKey(spaceId, userId, request.body);
        utils.sendResponse(response, 200, "application/json", {
            message: `API Key added successfully to space ${spaceId}`,
        });
    } catch (error) {
        switch (error.statusCode) {
            case 400:
                utils.sendResponse(response, 400, "application/json", {
                    message: "Bad Request: Invalid Key Type",
                });
                return;
            case 404:
                utils.sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                });
                return;
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: API Key already exists",
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }
}

async function deleteAPIKey(request, response) {
    const spaceId = request.params.spaceId;
    const keyType = request.params.keyType;
    if (!spaceId) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space ID or a valid currentSpaceId cookie is required",
        });
    }
    if (!keyType) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Key Type and Key Id are required in the request body",
        });
    }
    try {
        await space.APIs.deleteAPIKey(spaceId, keyType);
        utils.sendResponse(response, 200, "application/json", {
            message: `API Key deleted successfully from space ${spaceId}`,
        });
    } catch (error) {
        switch (error.statusCode) {
            case 404:
                utils.sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                });
                return;
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: API Key not found",
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }
}

async function getAPIKeysMetadata(request, response) {
    const spaceId = request.params.spaceId;
    try {
        let keys = await space.APIs.getAPIKeysMetadata(spaceId);
        return sendResponse(response, 200, "application/json", {
            data: keys,
        });
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            message: e
        });
    }
}

async function addSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementData = request.body;
    if (!announcementData.text || !announcementData.title) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: title and text are required"
        })
    }
    try {
        const announcementId = await space.APIs.addSpaceAnnouncement(spaceId, announcementData);
        utils.sendResponse(response, 200, "application/json", {
            message: `Announcement added successfully`,
            data: {announcementId: announcementId}
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

async function getSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementId = request.params.announcementId;
    if (!announcementId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: announcementId is required"
        })
    }
    if (!spaceId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: spaceId is required"
        })
    }
    try {
        const announcement = await space.APIs.getSpaceAnnouncement(spaceId, announcementId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Announcement loaded successfully`,
            data: announcement
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}

async function getSpaceAnnouncements(request, response) {
    const spaceId = request.params.spaceId;
    if (!spaceId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: spaceId is required"
        })
    }
    try {
        const announcements = await space.APIs.getSpaceAnnouncements(spaceId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Announcements loaded successfully`,
            data: announcements
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function updateSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementId = request.params.announcementId;
    const announcementData = request.body;
    if (!spaceId || !announcementId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: spaceId and announcementId are required"
        })
    }
    if (!announcementData.text || !announcementData.title) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: title and text are required"
        })
    }
    try {
        await space.APIs.updateSpaceAnnouncement(spaceId, announcementId, announcementData);
        utils.sendResponse(response, 200, "application/json", {
            message: `Announcement updated successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}

async function deleteSpaceAnnouncement(request, response) {
    const spaceId = request.params.spaceId;
    const announcementId = request.params.announcementId;
    if (!spaceId || !announcementId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: spaceId and announcementId are required"
        })
    }
    try {
        await space.APIs.deleteSpaceAnnouncement(spaceId, announcementId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Announcement deleted successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}


async function getChatTextResponse(request, response) {
    const spaceId = request.params.spaceId;
    const agentId = request.body.agentId;
    const userId = request.userId;
    const modelResponse = await getTextResponse(request, response);
    if (modelResponse.success) {
        const chatMessages = modelResponse.data.messages
        for (const chatMessage of chatMessages) {
            await space.APIs.addSpaceChatMessage(spaceId, agentId, agentId, "assistant", chatMessage);
            SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, `chat_${spaceId}`), {}, [userId]);
        }
    }
}

async function getChatTextStreamingResponse(request, response) {
    const spaceId = request.params.spaceId;
    const agentId = request.body.agentId;
    const userId = request.userId;

    let messageId = null;
    let isFirstChunk = true;
    let streamClosed = false;

    const updateQueue = [];
    let isProcessingQueue = false;
    try {
        response.on('close', async () => {
            if (!streamClosed) {
                streamClosed = true;
                updateQueue.length = 0;
            }
        });

        const processQueue = async () => {
            if (isProcessingQueue || streamClosed) return;
            isProcessingQueue = true;

            while (updateQueue.length > 0 && !streamClosed) {
                const currentChunk = updateQueue.shift();
                try {
                    await space.APIs.updateSpaceChatMessage(
                        spaceId,
                        agentId,
                        agentId,
                        messageId,
                        currentChunk
                    );
                    SubscriptionManager.notifyClients(
                        request.sessionId,
                        SubscriptionManager.getObjectId(spaceId, `chat_${agentId}`),
                        {},
                        [userId]
                    );
                } catch (error) {
                    console.error('Error updating message:', error);
                }
            }

            isProcessingQueue = false;
        };

        const streamContext = await getTextStreamingResponse(
            request,
            response,
            async (chunk) => {
                try {
                    if (streamClosed) return;

                    if (isFirstChunk) {
                        isFirstChunk = false;
                        messageId = await space.APIs.addSpaceChatMessage(
                            spaceId,
                            agentId,
                            agentId,
                            "assistant",
                            chunk
                        );
                        SubscriptionManager.notifyClients(
                            request.sessionId,
                            SubscriptionManager.getObjectId(spaceId, `chat_${agentId}`),
                            {},
                            [userId]
                        );
                    } else {
                        if (!messageId) return;
                        updateQueue.push(chunk);
                        await processQueue();
                    }
                } catch (error) {
                    console.error('Error processing chunk:', error);
                }
            }
        );

        await streamContext.streamPromise;
    } catch (error) {
        if (!response.headersSent) {
            response.status(500).json({error: 'Stream error'});
        }
    }
}

async function headFile(request, response) {
    const fileId = request.params.fileId;
    const type = request.headers['content-type'];
    try {
        const stats = await Storage.headFile(type, fileId);
        response.setHeader("Content-Type", "image/png");
        response.setHeader("Content-Length", stats.size);
        response.setHeader("Last-Modified", stats.mtime.toUTCString());
        response.setHeader("Accept-Ranges", "bytes");
        return response.end();
    } catch (error) {
        response.status = error.statusCode || 500;
        response.statusMessage = error.message;
        response.end();
    }
}


async function getFile(request, response) {
    const fileId = request.params.fileId;
    const type = request.headers['content-type'];
    try {
        let range = request.headers.range;
        const {fileStream, headers} = await Storage.getFile(type, fileId, range);
        response.writeHead(range ? 206 : 200, headers);
        fileStream.pipe(response);
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at reading file: ${fileId}`
        });
    }
}


async function putFile(request, response) {
    const fileId = request.params.fileId;
    const type = request.headers['content-type'];
    try {
        await Storage.putFile(type, fileId, request);
        return utils.sendResponse(response, 200, "application/json", {
            data: fileId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at writing fileId: ${fileId}`
        });
    }
}


async function deleteFile(request, response) {
    const fileId = request.params.fileId;
    const type = request.headers['content-type'];
    try {
        await Storage.deleteFile(type, fileId);
        return utils.sendResponse(response, 200, "application/json", {
            data: fileId,
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            message: error + ` Error at deleting file: ${fileId}`
        });
    }
}

async function importPersonality(request, response) {
    const spaceId = request.params.spaceId;
    const fileId = crypto.generateSecret(64);
    const tempDir = path.join(__dirname, '../../data-volume/Temp', fileId);
    const filePath = path.join(tempDir, `${fileId}.persai`);

    await fs.promises.mkdir(tempDir, {recursive: true});

    const busboy = Busboy({headers: request.headers});

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        const writeStream = fs.createWriteStream(filePath);
        file.pipe(writeStream);

        writeStream.on('finish', async () => {
            try {
                const extractedPath = path.join(tempDir, 'extracted');
                await fs.promises.mkdir(extractedPath, {recursive: true});

                await fs.createReadStream(filePath)
                    .pipe(unzipper.Extract({path: extractedPath}))
                    .promise();

                const importResult = await space.APIs.importPersonality(spaceId, extractedPath, request);

                utils.sendResponse(response, 200, "application/json", {
                    message: 'Personality imported successfully',
                    data: importResult
                });
            } catch (error) {
                utils.sendResponse(response, error.statusCode || 500, "application/json", {
                    message: `Error at importing personality: ${error.message}`
                });
            } finally {
                fs.rm(tempDir, {recursive: true}, err => {
                    if (err) console.error(`Error removing directory: ${err}`);
                });
            }
        });

        writeStream.on('error', (error) => {
            console.error('Error writing file:', error);
            utils.sendResponse(response, 500, "application/json", {
                message: `Error writing file: ${error.message}`
            });
        });
    });

    busboy.on('error', (error) => {
        console.error('Busboy error:', error);
        utils.sendResponse(response, 500, "application/json", {
            message: `Busboy error: ${error.message}`
        });
    });

    request.pipe(busboy);
}

async function exportPersonality(request, response) {
    const spaceId = request.params.spaceId;
    const personalityId = request.params.personalityId;
    try {
        const archiveStream = await space.APIs.archivePersonality(spaceId, personalityId);

        response.setHeader('Content-Disposition', `attachment; filename=${personalityId}.persai`);
        response.setHeader('Content-Type', 'application/zip');

        archiveStream.pipe(response);

        archiveStream.on('end', () => {
            response.end();
        });

        archiveStream.on('error', err => {
            utils.sendResponse(response, 500, "application/json", {
                message: `Error at exporting personality: ${personalityId}. ${err.message}`
            })
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Error at exporting personality: ${personalityId}. ${error.message}`
        });
    }
}

async function getUploadURL(request, response) {
    const type = request.headers["content-type"];
    try {
        const fileId = crypto.generateId();
        const {uploadURL, externalRequest} = await Storage.getUploadURL(type, fileId);
        return utils.sendResponse(response, 200, "application/json", {
            data: {
                uploadURL: uploadURL,
                fileId: fileId,
                externalRequest
            },
            message: `Upload URL retrieved successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Error getting an upload URL:` + error.message
        });
    }
}

async function getDownloadURL(request, response) {
    const type = request.headers["content-type"];
    const fileId = request.params.fileId;
    try {
        const {downloadURL, externalRequest} = await Storage.getDownloadURL(type, fileId);
        return utils.sendResponse(response, 200, "application/json", {
            data: {
                downloadURL: downloadURL,
                externalRequest: externalRequest
            },
            message: `Download URL retrieved successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Error getting a download URL:` + error.message
        });
    }
}

async function chatCompleteParagraph(request, response) {
    const spaceId = request.params.spaceId;
    const documentId = request.params.documentId;
    const paragraphId = request.params.paragraphId;

    const modelName = request.body.modelName;
    const agentId = request.body.agentId;


    if(modelName === undefined && agentId === undefined){
        return utils.sendResponse(response,400,"application/json",`modelName or agentId must be defined in the Request Body. Received modelName:${modelName}, agentId:${agentId}`)
    }

    if(modelName === undefined){
        const personalityData = await space.APIs.getPersonalityData(spaceId,agentId)
        if(!personalityData){
            return utils.sendResponse(response,400,"application/json",`Invalid agentId:${agentId}`)
        }
        request.body.modelName = personalityData.llms.text
    }

    const Paragraph = require('../document/services/paragraph.js')

    const updateQueue = [];
    let isProcessingQueue = false;
    let streamClosed = false;
    try {
        response.on('close', async () => {
            if (!streamClosed) {
                streamClosed = true;
                updateQueue.length = 0;
            }
        });

        const processQueue = async () => {
            if (isProcessingQueue || streamClosed) return;
            isProcessingQueue = true;

            while (updateQueue.length > 0 && !streamClosed) {
                const currentChunk = updateQueue.shift();
                try {
                    await Paragraph.updateParagraph(spaceId,documentId,paragraphId,currentChunk, {fields:"text"})
                } catch (error) {
                    console.error('Error updating message:', error);
                }
            }
            isProcessingQueue = false;
        };

        const streamContext = await getTextStreamingResponse(
            request,
            response,
            async (chunk) => {
                try {
                    if (streamClosed) return;
                    updateQueue.push(chunk);
                    await processQueue();
                } catch (error) {
                    console.error('Error processing chunk:', error);
                }
            }
        );
        await streamContext.streamPromise;
    } catch (error) {
        if (!response.headersSent) {
            response.status(500).json({error: 'Stream error'});
        }
    }
}

module.exports = {
    getUploadURL,
    getDownloadURL,
    headFile,
    getFile,
    putFile,
    deleteFile,
    getFileObjectsMetadata,
    getFileObject,
    getFileObjects,
    addFileObject,
    updateFileObject,
    deleteFileObject,
    getContainerObjectsMetadata,
    getContainerObject,
    addContainerObject,
    updateContainerObject,
    deleteContainerObject,
    getEmbeddedObject,
    addEmbeddedObject,
    updateEmbeddedObject,
    swapEmbeddedObjects,
    deleteEmbeddedObject,
    getSpace,
    addSpaceChatMessage,
    createSpace,
    deleteSpace,
    getSpaceCollaborators,
    deleteSpaceCollaborator,
    setSpaceCollaboratorRole,
    addCollaboratorsToSpace,
    getAgent,
    editAPIKey,
    deleteAPIKey,
    getAPIKeysMetadata,
    addSpaceAnnouncement,
    getSpaceAnnouncement,
    getSpaceAnnouncements,
    updateSpaceAnnouncement,
    deleteSpaceAnnouncement,
    getChatTextResponse,
    getChatTextStreamingResponse,
    exportPersonality,
    importPersonality,
    getSpaceChat,
    getFileObjectsMetadataPath,
    getFileObjectPath,
    resetSpaceChat,
    saveSpaceChat,
    chatCompleteParagraph
}
