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
const space = require("./space");
async function getAPIClient(request, pluginName, serverlessId){
    return await getAPIClientSDK(request.userId, pluginName, serverlessId, {sessionId: request.sessionId});
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
        let client = await getAPIClient(request, constants.SPACE_PLUGIN);
        let appSpecificClient = await getAPIClient(request, constants.APP_SPECIFIC_PLUGIN);
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
        let client = await getAPIClient(request, constants.SPACE_PLUGIN);
        let space;
        try {
            space = await client.createSpace(spaceName);
        } catch (e) {
            return utils.sendResponse(response, 500, "text/plain", e.message);
        }

        await secrets.createSpaceSecretsContainer(space.id);
        let appSpecificClient = await getAPIClient(request, constants.APP_SPECIFIC_PLUGIN);
        await appSpecificClient.linkSpaceToUser(email, space.id);

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

      /*  const copyRepo = async (src, dest) => {
            const entries = await fsPromises.readdir(src, { withFileTypes: true })
            await fsPromises.mkdir(dest, { recursive: true })

            for (const entry of entries) {
                const srcPath = path.join(src, entry.name)
                const destPath = path.join(dest, entry.name)

                if (entry.isDirectory()) {
                    await copyRepo(srcPath, destPath)
                } else {
                    await fsPromises.copyFile(srcPath, destPath)
                }
            }
        }

        const copyBinariesIfExist = async (repoSrcPath, binariesDest) => {
            const binariesSrc = path.join(repoSrcPath, 'binaries')
            try {
                const stat = await fsPromises.stat(binariesSrc)
                if (!stat.isDirectory()) return
                await copyRepo(binariesSrc, binariesDest)
            } catch (_) {
                //  ignore
            }
        }

        const copyAllRepos = async (sourceRoot, destRoot, binariesDest) => {
            const repos = await fsPromises.readdir(sourceRoot, { withFileTypes: true })
            for (const repo of repos) {
                if (!repo.isDirectory()) continue
                const srcPath = path.join(sourceRoot, repo.name)
                const destPath = path.join(destRoot, repo.name)

                await copyRepo(srcPath, destPath)
                await copyBinariesIfExist(srcPath, binariesDest)
            }
        }

        const defaultApplicationsPath = path.join(__dirname, '../defaultApplications')

        await copyAllRepos(defaultApplicationsPath, applicationsPath, binariesPath)*/

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
        let serverUrl = serverlessAPI.getUrl();
        server.registerServerlessProcessUrl(serverlessId, serverUrl);

        let spaceInstanceClient = await getAPIClient(request, constants.SPACE_INSTANCE_PLUGIN, space.id);
        await spaceInstanceClient.createWorkspace(space.name, space.id, request.userId, email);

        let agentAPIClient = await getAPIClient(request, constants.AGENT_PLUGIN, serverlessId);
        await agentAPIClient.copyDefaultAgents(serverlessAPIStorage, space.id);
        let applicationsAPIClient = await getAPIClient(request, constants.APPLICATION_PLUGIN, serverlessId);

        /*v2 defaultApplications config file */
        const defaultApplicationsPath = path.join(__dirname, 'defaultApplications.json');
        const defaultApplications = JSON.parse(await fsPromises.readFile(defaultApplicationsPath, 'utf-8'));

        for (const application of defaultApplications) {
            await applicationsAPIClient.installApplication(application)
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
    let soplangPlugins = ["AgentPlugin", "WorkspaceUser"];
    for(let plugin of soplangPlugins){
        const pluginRedirect = getRedirectCodeESModule(plugin);
        await fsPromises.writeFile(`${pluginsStorage}/${plugin}.js`, pluginRedirect);
    }
    const pluginRedirect = getRedirectCodeESModule(`DocumentsPlugin`);
    await fsPromises.writeFile(`${pluginsStorage}/Documents.js`, pluginRedirect);
    const pluginRedirect2 = getRedirectCodeESModule(`WorkspacePlugin`);
    await fsPromises.writeFile(`${pluginsStorage}/Workspace.js`, pluginRedirect2);
    const pluginRedirect3 = getRedirectCodeESModule(`StandardPersistencePlugin`);
    await fsPromises.writeFile(`${pluginsStorage}/DefaultPersistence.js`, pluginRedirect3);

    const emailPluginRedirect = `module.exports = require("../../../../../apihub-components/globalServerlessAPI/plugins/EmailPlugin.js")`;
    await fsPromises.writeFile(`${pluginsStorage}/EmailPlugin.js`, emailPluginRedirect);
}

async function deleteSpace(request, response) {
    const spaceId = request.params.spaceId;
    let email = request.email;
    try {
        let client = await getAPIClient(request, constants.SPACE_PLUGIN);
        let message = await client.deleteSpace(email, request.authKey, spaceId);
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

async function editAPIKey(request, response) {
    const spaceId = request.params.spaceId;
    if (!spaceId) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space ID or a valid currentSpaceId cookie is required",
        });
    }
    if (!request.body.keyType) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Key Type and is required in the request body",
        });
    }
    const userId = request.userId;
    try {
        await space.editAPIKey(spaceId, userId, request.body.keyType, request.body.APIKey);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
        });
    }
}

async function getAPIKeysMasked(request, response) {
    const spaceId = request.params.spaceId;
    try {
        let keys = await space.getAPIKeysMasked(spaceId);
        return sendResponse(response, 200, "application/json", keys);
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            message: e.message
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
    getSpaceStatus,
    addSpaceChatMessage,
    createSpace,
    deleteSpace,
    editAPIKey,
    getAPIKeysMasked,
    getChatTextResponse,
    getChatTextStreamingResponse,
    importPersonality,
    getSpaceChat,
    resetSpaceChat,
    saveSpaceChat,
    chatCompleteParagraph,
    listUserSpaces
}
