require('../../assistos-sdk/build/bundles/assistos_sdk.js');
const utils = require('../apihub-component-utils/utils.js');
const cookie = require('../apihub-component-utils/cookie.js');
const crypto = require('../apihub-component-utils/crypto.js');
const fsPromises = require('fs').promises;
const path = require('path');
const SubscriptionManager = require("../subscribers/SubscriptionManager.js");
const {sendResponse} = require("../apihub-component-utils/utils");
const Storage = require("../apihub-component-utils/storage.js");
const {
    getTextResponse,
    getTextStreamingResponse
} = require('../llms/controller.js');
let assistOSSDK = require('assistos');
const constants = assistOSSDK.constants;

const getAPIClientSDK = assistOSSDK.utils.getAPIClient;

const fs = require("fs");
const Busboy = require('busboy');
const unzipper = require('unzipper');
const secrets = require("../apihub-component-utils/secrets");
const process = require("process");

async function getAPIClient(request, pluginName, serverlessId){
    return await getAPIClientSDK(request.userId, pluginName, serverlessId, {
        sessionId: request.sessionId,
        email: request.email,
        authToken: request.authToken,
    });
}
async function listUserSpaces(req, res){
    let {email} = req.query;
    if(!email){
        email = req.email;
    }
    email = decodeURIComponent(email);
    try {
        const appSpecificClient = await getAPIClient(req, constants.APP_SPECIFIC_PLUGIN);
        const user = await appSpecificClient.listUserSpaces(email);
        utils.sendResponse(res, 200, "application/json", user);
    } catch (e) {
        utils.sendResponse(res, 500, "text/plain", e.message);
    }

}

async function getSpaceStatus(request, response) {
    try {
        let spaceId;
        let client = await getAPIClient(request, constants.APP_SPECIFIC_PLUGIN);
        const email = request.email;
        if (request.params.spaceId && request.params.spaceId !== "undefined") {
            spaceId = request.params.spaceId;
        } else if (request.currentSpaceId && request.currentSpaceId !== "undefined") {
            spaceId = request.currentSpaceId;
        } else {
            spaceId = await client.getDefaultSpaceId(email);
        }

        let spaceStatus = await client.getSpaceStatus(spaceId);
        await client.setUserCurrentSpace(email, spaceId);
        utils.sendResponse(response, 200, "application/json", spaceStatus, cookie.createCurrentSpaceCookie(spaceId));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function createSpace(request, response, server) {
    const spaceName = request.body.spaceName;
    let email = request.body.email;
    if(!email){
        email = request.email;
    }
    if (!spaceName) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
        });
        return;
    }
    try {
        let client = await getAPIClient(request, constants.APP_SPECIFIC_PLUGIN);
        let space;
        try {
            space = await client.createSpace(spaceName, email);
        } catch (e) {
            return utils.sendResponse(response, 500, "text/plain", e.message);
        }

        await secrets.createSpaceSecretsContainer(space.id);
        await client.linkSpaceToUser(email, space.id);

        let spacesFolder = path.join(server.rootFolder, "external-volume", "spaces");
        let serverlessAPIStorage = path.join(spacesFolder, space.id);
        let pluginsStorage = path.join(serverlessAPIStorage, "plugins");
        await fsPromises.mkdir(pluginsStorage, {recursive: true});
        let persistenceStorage = path.join(serverlessAPIStorage, "persistence");
        await fsPromises.mkdir(persistenceStorage, {recursive: true});
        let applicationsPath = path.join(serverlessAPIStorage, "applications");
        await fsPromises.mkdir(applicationsPath, {recursive: true});
        const binariesPath = path.join(serverlessAPIStorage, "binaries");
        await fsPromises.mkdir(binariesPath, {recursive: true});

        await createSpacePlugins(pluginsStorage);

        //create serverless API for new space
        let serverlessId = space.id;
        const serverlessAPI = await server.createServerlessAPI({
            urlPrefix: serverlessId,
            storage: serverlessAPIStorage,
            env: {
                PERSISTENCE_FOLDER: path.join(serverlessAPIStorage, "persistence"),
                SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
                SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL
            }
        });
        server.registerServerlessProcess(serverlessId, serverlessAPI);

        let workspaceClient = await getAPIClient(request, constants.WORKSPACE_PLUGIN, space.id);
        await workspaceClient.createWorkspace(space.name, space.id, request.userId, email);

        let agentAPIClient = await getAPIClient(request, constants.AGENT_PLUGIN, serverlessId);
        await agentAPIClient.copyDefaultAgents(serverlessAPIStorage, space.id);

        const defaultApplicationsPath = path.join(__dirname, 'defaultApplications.json');
        const defaultApplications = JSON.parse(await fsPromises.readFile(defaultApplicationsPath, 'utf-8'));

        const ApplicationModule = assistOSSDK.loadModule("application", {
            email: email,
            authToken: request.authToken,
            userId: request.userId
        });

        for (const application of defaultApplications) {
            await ApplicationModule.installApplication(space.id,application)
        }
        utils.sendResponse(response, 200, "text/plain", space.id, cookie.createCurrentSpaceCookie(space.id));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error.message}`,
        });
    }
}
function getRedirectCodeESModule(pluginName){
    return `const pluginPromise = import("../../../../../apihub-components/soplang/plugins/${pluginName}.js");

module.exports = {
    getAllow: async (...args) => {
        const plugin = await pluginPromise;
        return plugin.getAllow(...args);
    },
    getDependencies: async (...args) => {
        const plugin = await pluginPromise;
        return plugin.getDependencies(...args);
    },
    getInstance: async (...args) => {
        const plugin = await pluginPromise;
        return plugin.getInstance(...args);
    },
};`
}
async function createSpacePlugins(pluginsStorage){
    let workspacePluginsDir = await fsPromises.readdir("../apihub-components/globalServerlessAPI/workspacePlugins");
    for(let plugin of workspacePluginsDir){
        const pluginRedirect = `module.exports = require("../../../../../apihub-components/globalServerlessAPI/workspacePlugins/${plugin}")`;
        await fsPromises.writeFile(`${pluginsStorage}/${plugin}`, pluginRedirect);
    }
    let soplangPlugins = ["Agent", "WorkspaceUser", "Documents", "Workspace", "LLM", "Table"];
    for(let plugin of soplangPlugins){
        const pluginRedirect = getRedirectCodeESModule(plugin);
        await fsPromises.writeFile(`${pluginsStorage}/${plugin}.js`, pluginRedirect);
    }
    const pluginRedirect3 = getRedirectCodeESModule(`StandardPersistence`);
    await fsPromises.writeFile(`${pluginsStorage}/DefaultPersistence.js`, pluginRedirect3);

    const emailPluginRedirect = `module.exports = require("../../../../../apihub-components/globalServerlessAPI/plugins/EmailPlugin.js")`;
    await fsPromises.writeFile(`${pluginsStorage}/EmailPlugin.js`, emailPluginRedirect);
}

async function deleteSpace(request, response, server) {
    const spaceId = request.params.spaceId;
    let email = request.email;
    try {
        let client = await getAPIClient(request, constants.APP_SPECIFIC_PLUGIN);
        let message = await client.deleteSpace(email, spaceId);
        if (!message) {
            //space deleted

            //delete space folder
            let spacePath = path.join(server.rootFolder, "external-volume", "spaces", spaceId);
            await fsPromises.rm(spacePath, {recursive: true, force: true});
            await secrets.deleteSpaceSecrets(spaceId);

            let objectId = SubscriptionManager.getObjectId(spaceId, `space`);
            SubscriptionManager.notifyClients(request.sessionId, objectId, "delete");
            cookie.deleteCurrentSpaceCookie();
        }
        utils.sendResponse(response, 200, "text/plain", message || "");
    } catch (error) {
        utils.sendResponse(response, 500, "text/plain", error.message);
    }
}

async function getSecretsMasked(request, response) {
    const spaceId = request.params.spaceId;
    try {
        let keys = await secrets.getSecretsMasked(spaceId);
        return sendResponse(response, 200, "application/json", keys);
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}
async function addSecret(request, response){
    const spaceId = request.params.spaceId;
    try {
        await secrets.addSecret(spaceId, request.userId, request.body.name, request.body.secretKey, request.body.value);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }
}
async function deleteSecret(request, response){
    const spaceId = request.params.spaceId;
    try {
        await secrets.deleteSecret(spaceId, request.body.secretKey);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }
}
async function editSecret(request, response) {
    const spaceId = request.params.spaceId;
    if (!spaceId) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space ID or a valid currentSpaceId cookie is required",
        });
    }
    const userId = request.userId;
    try {
        await secrets.putSpaceKey(spaceId, userId, request.body.secretKey, request.body.name, request.body.value);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }
}

async function restartServerless(request, response){
    let serverlessId = request.params.spaceId;
    const baseURL = process.env.BASE_URL;
    try {
        let res = await fetch(`${baseURL}/proxy/setEnv/${serverlessId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sessionId=${request.sessionId}`
            }
        });
        if(res.status !== 200){
            utils.sendResponse(response, 500, "application/json", {
                message: `Serverless restart failed: ${res.status}`,
            });
        }
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }

    utils.sendResponse(response, 200, "application/json", {});

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

async function isFounder(request, response) {
    try {
        const client = await getAPIClient(request, constants.APP_SPECIFIC_PLUGIN);
        const isFounder = await client.isFounder(request.userId);
        utils.sendResponse(response, 200, "application/json", isFounder);
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error.message}`,
        });
    }
}
module.exports = {
    getApplicationEntry,
    getUploadURL,
    getDownloadURL,
    headFile,
    getFile,
    putFile,
    deleteFile,
    getSpaceStatus,
    createSpace,
    deleteSpace,
    addSecret,
    editSecret,
    getSecretsMasked,
    deleteSecret,
    getChatTextResponse,
    getChatTextStreamingResponse,
    importPersonality,
    chatCompleteParagraph,
    listUserSpaces,
    restartServerless,
    isFounder
}
