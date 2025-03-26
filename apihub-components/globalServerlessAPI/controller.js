require('../../assistos-sdk/build/bundles/assistos_sdk.js');
const utils = require('../apihub-component-utils/utils.js');
const cookie = require('../apihub-component-utils/cookie.js');
const space = require("./space.js");
const enclave = require("opendsu").loadAPI("enclave");
const crypto = require('../apihub-component-utils/crypto.js');
const fsPromises = require('fs').promises;
const path = require('path');
const SubscriptionManager = require("../subscribers/SubscriptionManager.js");
const {sendResponse} = require("../apihub-component-utils/utils");
const Storage = require("../apihub-component-utils/storage.js");
const lightDB = require("../apihub-component-utils/lightDB.js");
const {ensurePersonalityChats} = require("../personalities-storage/handler.js");
const {
    getTextResponse,
    getTextStreamingResponse
} = require('../llms/controller.js');
const constants = require('./constants.js');
const fs = require("fs");


const Busboy = require('busboy');
const unzipper = require('unzipper');
async function listUserSpaces(req, res){
    let {email} = req.query;
    if(!email){
        email = req.email;
    }
    email = decodeURIComponent(email);
    try {
        const appSpecificClient = getAppSpecificAPIClient(req.userId);
        const user = await appSpecificClient.listUserSpaces(email);
        utils.sendResponse(res, 200, "application/json", user);
    } catch (e) {
        utils.sendResponse(res, 500, "text/plain", e.message);
    }

}
async function getContainerObjectsMetadata(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    try {
        const metadata = await lightDB.getContainerObjectsMetadata(spaceId, objectType);
        return utils.sendResponse(response, 200, "application/json", metadata);
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
        return utils.sendResponse(response, 200, "application/json", object);
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
        return utils.sendResponse(response, 200, "application/json", objectId);
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
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));
        SubscriptionManager.notifyClients(request.sessionId, SubscriptionManager.getObjectId(spaceId, objectId));
        return utils.sendResponse(response, 200, "text/plain", objectId);
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
        return utils.sendResponse(response, 200, "text/plain", objectId);
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
        return utils.sendResponse(response, 200, "application/json", embeddedObject);
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
        return utils.sendResponse(response, 200, "text/plain", objectId);
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
        return utils.sendResponse(response, 200, "text/plain", objectId);
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
        return utils.sendResponse(response, 200, "text/plain", objectURI);
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
        return utils.sendResponse(response, 200, "text/plain", objectURI);
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
        utils.sendResponse(response, 200, "application/json", {messageId: messageId});
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
        utils.sendResponse(response, 200, "application/json", chat);
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
        return utils.sendResponse(response, 200, "application/json", chat);
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
        return utils.sendResponse(response, 200, "application/json", chat);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error
        });
    }
}

async function getSpaceStatus(request, response) {
    try {
        let spaceId;
        let client = getAPIClient(request.userId, constants.SPACE_PLUGIN);
        let appSpecificClient = getAppSpecificAPIClient(request.userId);
        const email = request.email;
        if (request.params.spaceId) {
            spaceId = request.params.spaceId;
        } else if (request.currentSpaceId) {
            spaceId = request.currentSpaceId;
        } else {
            spaceId = await appSpecificClient.getDefaultSpaceId(email);
        }
        try {
            await ensurePersonalityChats(spaceId);
        } catch (error) {

        }

        let spaceStatus = await client.getSpaceStatus(spaceId);
        await appSpecificClient.setUserCurrentSpace(email, spaceId);
        utils.sendResponse(response, 200, "application/json", spaceStatus, cookie.createCurrentSpaceCookie(spaceId));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}
function getAPIClient(userId, pluginName, serverlessId){
    if(!serverlessId){
        serverlessId = process.env.SERVERLESS_ID;
    }
    return require("opendsu").loadAPI("serverless").createServerlessAPIClient(userId, process.env.BASE_URL, serverlessId, pluginName);
}
function getAppSpecificAPIClient(userId){
    return require("opendsu").loadAPI("serverless").createServerlessAPIClient(userId, process.env.BASE_URL, process.env.SERVERLESS_ID, constants.APP_SPECIFIC_PLUGIN);
}
async function createSpace(request, response, server) {
    const email = request.email;
    const spaceName = request.body.spaceName;
    if (!spaceName) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
        });
        return;
    }
    try {
        let client = getAPIClient(request.userId, constants.SPACE_PLUGIN);
        let spacesFolder = path.join(server.rootFolder, "external-volume", "spaces");
        let result = await client.createSpace(spaceName, email, spacesFolder);
        if(result.status === "failed"){
            return utils.sendResponse(response, 500, "text/plain", result.reason);
        }
        let space = result.space;
        let appSpecificClient = getAppSpecificAPIClient(request.userId);
        await appSpecificClient.linkSpaceToUser(email, space.id)

        let serverlessAPIStorage = path.join(spacesFolder, space.id);
        //make space plugins available to the new serverless
        let pluginsStorage = path.join(serverlessAPIStorage, "plugins");
        await fsPromises.mkdir(pluginsStorage, {recursive: true});
        //let defaultPlugins = ["PersonalityPlugin", "SpaceInstancePersistence", "ApplicationPlugin"];
        // for(let plugin of defaultPlugins){
        //     const pluginRedirect = `module.exports = require("../../../../../apihub-components/globalServerlessAPI/plugins/${plugin}.js")`;
        //     await fsPromises.writeFile(`${pluginsStorage}/${plugin}.js`, pluginRedirect);
        // }
        const pluginRedirect = `module.exports = require("../../../../../apihub-components/soplang/plugins/StandardPersistencePlugin.js")`;
        await fsPromises.writeFile(`${pluginsStorage}/StandardPersistencePlugin.js`, pluginRedirect);
        const pluginRedirect2 = `module.exports = require("../../../../../apihub-components/soplang/plugins/WorkspacePlugin.js")`;
        await fsPromises.writeFile(`${pluginsStorage}/WorkspacePlugin.js`, pluginRedirect2);


        //create serverless API for new space
        let serverlessId = space.id;
        const serverlessAPI = await server.createServerlessAPI({
            urlPrefix: serverlessId,
            storage: serverlessAPIStorage});
        let serverUrl = serverlessAPI.getUrl();
        server.registerServerlessProcessUrl(serverlessId, serverUrl);

        // let personalityAPIClient = getAPIClient(request.userId, constants.PERSONALITY_PLUGIN, serverlessId);
        // await personalityAPIClient.copyDefaultPersonalities(serverlessAPIStorage, space.id);
        
        utils.sendResponse(response, 200, "text/plain", space.id, cookie.createCurrentSpaceCookie(space.id));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error.message}`,
        });
    }
}

async function deleteSpace(request, response) {
    const spaceId = request.params.spaceId;
    let email = request.email;
    try {
        let message = await space.APIs.deleteSpace(email, request.authKey, spaceId);
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
        utils.sendResponse(response, 200, "application/json", collaborators);
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
        utils.sendResponse(response, 200, "text/plain", message);
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
        return utils.sendResponse(response, 200, "text/plain", "You can't delete yourself from the space");
    }
    try {
        let message = await space.APIs.deleteSpaceCollaborator(request.userId, spaceId, collaboratorId);
        utils.sendResponse(response, 200, "text/plain", message);
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
        utils.sendResponse(response, 200, "application/json", existingCollaborators);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }

}

async function getAgent(request, response) {
    let agentId = request.params.agentId;
    const spaceId = request.params.spaceId;
    try {
        let client = getAPIClient(request.userId, constants.SPACE_PLUGIN);
        if (!agentId) {
            agentId = await client.getDefaultSpaceAgentId(spaceId);
        }
        let SecurityContext = require("assistos").ServerSideSecurityContext;
        let personalityModule = require("assistos").loadModule("personality", new SecurityContext(request));
        const agent = await personalityModule.getPersonality(spaceId, agentId);
        utils.sendResponse(response, 200, "application/json", agent)
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message,
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
        return sendResponse(response, 200, "application/json", keys);
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            message: e.message
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
        utils.sendResponse(response, 200, "application/json", {announcementId: announcementId});
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
        utils.sendResponse(response, 200, "application/json", announcement);
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
        utils.sendResponse(response, 200, "application/json", announcements);
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
        return utils.sendResponse(response, 200, "text/plain", fileId);
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
        return utils.sendResponse(response, 200, "text/plain", fileId);
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
                utils.sendResponse(response, 200, "application/json", importResult);
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
        let data = {
            uploadURL: uploadURL,
            fileId: fileId,
            externalRequest
        }
        return utils.sendResponse(response, 200, "application/json", data);
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
        let data = {
            downloadURL: downloadURL,
            externalRequest: externalRequest
        }
        return utils.sendResponse(response, 200, "application/json", data);
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


    if (modelName === undefined && agentId === undefined) {
        return utils.sendResponse(response, 400, "application/json", `modelName or agentId must be defined in the Request Body. Received modelName:${modelName}, agentId:${agentId}`)
    }

    if (modelName === undefined) {
        const personalityData = await space.APIs.getPersonalityData(spaceId, agentId)
        if (!personalityData) {
            return utils.sendResponse(response, 400, "application/json", `Invalid agentId:${agentId}`)
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
                    await Paragraph.updateParagraph(spaceId, documentId, paragraphId, currentChunk, {fields: "text"})
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

const getApplicationEntry = async (request, response) => {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    try {
        const entryHTML = await space.APIs.getApplicationEntry(spaceId, applicationId);
        utils.sendResponse(response, 200, "text/html", entryHTML);
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}
const getWebChatConfiguration = async (request, response) => {
    const spaceId = request.params.spaceId;
    try {
        const configuration = await space.APIs.getWebChatConfiguration(spaceId);
        utils.sendResponse(response, 200, "application/json", configuration);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function addWebAssistantConfigurationPage(request, response) {
    const spaceId = request.params.spaceId;
    const pageData = request.body;
    try {
        const pageId = await space.APIs.addWebAssistantConfigurationPage(spaceId, pageData);
        utils.sendResponse(response, 200, "application/json", {pageId});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function getWebAssistantConfigurationPages(request, response) {
    const spaceId = request.params.spaceId;
    try {
        const pages = await space.APIs.getWebAssistantConfigurationPages(spaceId);
        utils.sendResponse(response, 200, "application/json", pages);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function getWebAssistantConfigurationPage(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    try {
        const page = await space.APIs.getWebAssistantConfigurationPage(spaceId, pageId);
        utils.sendResponse(response, 200, "application/json", page);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function updateWebAssistantConfigurationPage(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    const pageData = request.body;
    try {
        await space.APIs.updateWebAssistantConfigurationPage(spaceId, pageId, pageData);
        utils.sendResponse(response, 200, "application/json", {
            message: `Page updated successfully`
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function deleteWebAssistantConfigurationPage(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    try {
        await space.APIs.deleteWebAssistantConfigurationPage(spaceId, pageId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Page deleted successfully`
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function getWebAssistantConfigurationPageMenu(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    try {
        const menu = await space.APIs.getWebAssistantConfigurationPageMenu(spaceId, pageId);
        utils.sendResponse(response, 200, "application/json", menu);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function addWebAssistantConfigurationPageMenuItem(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    const menuItem = request.body;
    try {
        const menuItemId = await space.APIs.addWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItem);
        utils.sendResponse(response, 200, "application/json", {menuItemId});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function updateWebAssistantConfigurationPageMenuItem(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    const menuItemId = request.params.menuItemId;
    const menuItemData = request.body;
    try {
        await space.APIs.updateWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItemId, menuItemData);
        utils.sendResponse(response, 200, "application/json", {
            message: `Menu item updated successfully`
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function deleteWebAssistantConfigurationPageMenuItem(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    const menuItemId = request.params.menuItemId;
    try {
        await space.APIs.deleteWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItemId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Menu item deleted successfully`
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function getWebAssistantConfigurationPageMenuItem(request, response) {
    const spaceId = request.params.spaceId;
    const pageId = request.params.pageId;
    const menuItemId = request.params.menuItemId;
    try {
        const menuItem = await space.APIs.getWebAssistantConfigurationPageMenuItem(spaceId, pageId, menuItemId);
        utils.sendResponse(response, 200, "application/json", menuItem);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function updateWebChatConfiguration(request, response) {
    const spaceId = request.params.spaceId;
    const configuration = request.body;
    try {
        await space.APIs.updateWebChatConfiguration(spaceId, configuration);
        utils.sendResponse(response, 200, "application/json", {
            message: `Configuration updated successfully`
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function getWebAssistantHomePage(request, response) {
    const spaceId = request.params.spaceId;
    try {
        const homePage = await space.APIs.getWebAssistantHomePage(request, response, spaceId);
        utils.sendResponse(response, 200, "application/json", homePage);
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function getWidget(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const widgetName = request.params.widgetName;
    function convertToPascalCase(str) {
        return str
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }


    try {
        const {html, css, js} = await space.APIs.getWidget(spaceId, applicationId,widgetName);
        utils.sendResponse(response, 200, "application/json", {html, css, js,presenterClassName:convertToPascalCase(widgetName)});
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}

module.exports = {
    getWidget,
    getWebAssistantHomePage,
    updateWebChatConfiguration,
    getWebAssistantConfigurationPageMenuItem,
    getWebAssistantConfigurationPage,
    addWebAssistantConfigurationPage,
    getWebAssistantConfigurationPages,
    updateWebAssistantConfigurationPage,
    deleteWebAssistantConfigurationPage,
    getWebAssistantConfigurationPageMenu,
    addWebAssistantConfigurationPageMenuItem,
    updateWebAssistantConfigurationPageMenuItem,
    deleteWebAssistantConfigurationPageMenuItem,
    getWebChatConfiguration,
    getApplicationEntry,
    getUploadURL,
    getDownloadURL,
    headFile,
    getFile,
    putFile,
    deleteFile,
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
    getSpaceStatus,
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
    resetSpaceChat,
    saveSpaceChat,
    chatCompleteParagraph,
    listUserSpaces
}
