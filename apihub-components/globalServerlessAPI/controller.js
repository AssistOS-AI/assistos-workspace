const assistOSSDK = require('../../assistos-sdk/dist/assistos-sdk.umd.js');
const utils = require('../apihub-component-utils/utils.js');
const cookie = require('../apihub-component-utils/cookie.js');
const crypto = require('../apihub-component-utils/crypto.js');

const fsPromises = require('fs').promises;
const path = require('path');
const {sendResponse, sendFileToClient} = require("../apihub-component-utils/utils");
const Storage = require("../apihub-component-utils/storage.js");
// let assistOSSDK = require('assistos');
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
        const adminClient = await getAPIClient(req, constants.ASSISTOS_ADMIN_PLUGIN);
        const user = await adminClient.listUserSpaces(email);
        utils.sendResponse(res, 200, "application/json", user);
    } catch (e) {
        utils.sendResponse(res, 500, "text/plain", e.message);
    }

}

async function getSpaceStatus(request, response) {
    try {
        let spaceId;
        let client = await getAPIClient(request, constants.ASSISTOS_ADMIN_PLUGIN);
        const email = request.email;
        if (request.params.spaceId && request.params.spaceId !== "undefined") {
            spaceId = request.params.spaceId;
        } else if (request.currentSpaceId && request.currentSpaceId !== "undefined") {
            spaceId = request.currentSpaceId;
        } else {
            spaceId = await client.getDefaultSpaceId(email);
        }
        console.log("DEBUG: spaceId", spaceId);
        let workspaceClient = await getAPIClient(request, constants.WORKSPACE_PLUGIN, spaceId);
        console.log("DEBUG: workspaceClient", workspaceClient);
        let workspace = await workspaceClient.getWorkspace(spaceId);
        console.log("DEBUG: workspace", workspace);
        await client.setUserCurrentSpace(email, spaceId);
        utils.sendResponse(response, 200, "application/json", workspace, cookie.createCurrentSpaceCookie(spaceId));
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
        let client = await getAPIClient(request, constants.ASSISTOS_ADMIN_PLUGIN);
        let space;
        try {
            space = await client.createSpace(spaceName, request.email);
        } catch (e) {
            return utils.sendResponse(response, 500, "text/plain", e.message);
        }
        await secrets.createSpaceSecretsContainer(space.id);

        let spacesFolder = path.join(server.rootFolder, "external-volume", "spaces");
        let serverlessAPIStorage = path.join(spacesFolder, space.id);
        let pluginsStorage = path.join(serverlessAPIStorage, "plugins");
        await fsPromises.mkdir(pluginsStorage, {recursive: true});
        let persistenceStorage = path.join(serverlessAPIStorage, "persistence");
        await fsPromises.mkdir(persistenceStorage, {recursive: true});
        let applicationsPath = path.join(serverlessAPIStorage, "applications");
        await fsPromises.mkdir(applicationsPath, {recursive: true});

        await createSpacePlugins(pluginsStorage);

        //create serverless API for new space
        let serverlessId = space.id;
        const envVars = {
            SERVERLESS_ROOT_FOLDER: serverlessAPIStorage,
            PERSISTENCE_FOLDER: path.join(serverlessAPIStorage, "persistence"),
            SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
            SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL,
            INTERNAL_WEBHOOK_URL: `${process.env.BASE_URL}/internalWebhook`
        }
        const serverlessAPI = await server.createServerlessAPI({
            urlPrefix: serverlessId,
            storage: serverlessAPIStorage,
            env: envVars
        });
        server.registerServerlessProcess(serverlessId, serverlessAPI);

        let workspaceClient = await getAPIClient(request, constants.WORKSPACE_PLUGIN, space.id);
        let workspaceUser = await getAPIClient(request, constants.WORKSPACE_USER_PLUGIN, space.id);
        await workspaceClient.createWorkspace(space.name, request.userId, space.id, email);
        let webAssistantClient = await getAPIClient(request, constants.WEB_ASSISTANT_PLUGIN, space.id);
        let webAssistantDefaults = await fsPromises.readFile(path.join(__dirname, "defaults", "webAssistantDefaults.json"), "utf-8");
        await webAssistantClient.createWebAssistant(JSON.parse(webAssistantDefaults));

        await workspaceUser.createUser(email, email, "admin");

        let chatId = await createDefaultAgent(request, space.id);
        await workspaceClient.setCurrentChatId(space.id, chatId);

        await linkSystemApps(space.id, applicationsPath, request, server);
        await secrets.addSpaceEnvVarsSecrets(space.id, envVars);
        utils.sendResponse(response, 200, "text/plain", space.id, cookie.createCurrentSpaceCookie(space.id));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error.message}`,
        });
    }
}
async function linkSystemApps(spaceId, applicationsPath, req, server){
    const appsPath = path.join(__dirname, 'applications.json');
    const apps = JSON.parse(await fsPromises.readFile(appsPath, 'utf-8'));
    const defaultApps = apps.filter(app => app.systemApp);
    for (const application of defaultApps) {
        const systemAppPath = path.join(server.rootFolder, "external-volume", "systemApps", application.name);
        const spaceAppLinkPath = path.join(applicationsPath, application.name);
        await fsPromises.access(systemAppPath);
        await fsPromises.symlink(systemAppPath, spaceAppLinkPath, 'dir');
    }
}
async function createDefaultAgent(request, spaceId){
    let agentClient = await getAPIClient(request, constants.AGENT_PLUGIN, spaceId);
    let agent = await agentClient.createDefaultAgent(spaceId);
    await agentClient.selectLLM(agent.name, "chat", "gpt-4.1-nano", "OpenAI");
    let chatScriptClient = await getAPIClient(request, constants.CHAT_SCRIPT_PLUGIN, spaceId);
    let chatScriptsPath = path.join(__dirname, "defaults", "chat-scripts");
    let chatScripts = await fsPromises.readdir(chatScriptsPath);
    for(let chatScript of chatScripts){

        let chatScriptData = await fsPromises.readFile(path.join(chatScriptsPath, chatScript), "utf-8");
        chatScriptData = JSON.parse(chatScriptData);
        let code = "";
        for(let line of chatScriptData.code){
            code += line + "\n";
        }
        await chatScriptClient.createChatScript(chatScriptData.name, code, chatScriptData.description, chatScriptData.components, chatScriptData.role);
    }

    let chatAPIClient = await getAPIClient(request, constants.CHAT_ROOM_PLUGIN, spaceId);
    let chatId = `${agent.name}_Chat`;
    await chatAPIClient.createChat(request.email, chatId, "DefaultScript", ["User", "Assistant"]);
    return chatId;
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
    let soplangPlugins = ["Agent", "WorkspaceUser", "Documents", "Workspace", "LLM", "ChatRoom", "ChatScript", "Table"];
    for(let plugin of soplangPlugins){
        const pluginRedirect = getRedirectCodeESModule(plugin);
        await fsPromises.writeFile(`${pluginsStorage}/${plugin}.js`, pluginRedirect);
    }
    const pluginRedirect3 = getRedirectCodeESModule(`StandardPersistence`);
    await fsPromises.writeFile(`${pluginsStorage}/DefaultPersistence.js`, pluginRedirect3);

    const emailPluginRedirect = `module.exports = require("../../../../../apihub-components/globalServerlessAPI/plugins/EmailPlugin.js")`;
    await fsPromises.writeFile(`${pluginsStorage}/EmailPlugin.js`, emailPluginRedirect);
}

async function installSystemApps(){
    async function dirExists(path) {
        try {
            await fsPromises.access(path);
            return true;
        } catch {
            return false;
        }
    }
    let systemAppsPath = path.join(process.env.PERSISTENCE_FOLDER, "../systemApps");
    if(!await dirExists(systemAppsPath)){
        const appsPath = path.join(__dirname, 'applications.json');
        const apps = JSON.parse(await fsPromises.readFile(appsPath, 'utf-8'));
        const defaultApps = apps.filter(app => app.systemApp);
        const ApplicationModule = assistOSSDK.loadModule("application", {
            email: process.env.SYSADMIN_EMAIL,
            authToken: process.env.SERVERLESS_AUTH_SECRET,
        });
        for(let app of defaultApps){
            await ApplicationModule.installSystemApp(app.name);
        }
    }
}
async function deleteSpace(request, response, server) {
    const spaceId = request.params.spaceId;
    let email = request.email;
    try {
        let client = await getAPIClient(request, constants.ASSISTOS_ADMIN_PLUGIN);
        let message = await client.deleteSpace(email, spaceId);
        if (!message) {
            //space deleted

            //delete space folder
            let spacePath = path.join(server.rootFolder, "external-volume", "spaces", spaceId);
            await fsPromises.rm(spacePath, {recursive: true, force: true});
            await secrets.deleteSpaceSecrets(spaceId, request.userId);

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
        await secrets.addSecret(spaceId, request.userId, request.body.secretKey, request.body.value);
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
        await secrets.putSpaceKey(spaceId, userId, request.body.secretKey, request.body.value);
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
        let res = await fetch(`${baseURL}/proxy/restart/${serverlessId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sessionId=${request.sessionId}`
            }
        });
        if(res.status !== 200){
            return utils.sendResponse(response, 500, "application/json", {
                message: `Serverless restart failed: ${res.status}`,
            });
        }
    } catch (e) {
        return utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${e.message}`,
        });
    }

    utils.sendResponse(response, 200, "application/json", {});

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
async function getWidget(req,res) {
    const spaceId = req.params.spaceId;
    const applicationId = req.params.applicationId;
    const widgetName = req.params.widgetName;

    function convertToPascalCase(str) {
        return str
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
    }

    try {
        let html, css;
        let componentPath;
        if (applicationId === "assistOS") {
            componentPath = path.join(__dirname, `../../apihub-root/wallet/web-components/widgets/${widgetName}`);
        } else {
            const applicationPath = path.join(__dirname, `../../apihub-root/external-volume/spaces/${spaceId}/applications/${applicationId}`);
            componentPath = path.join(applicationPath, `widgets/${widgetName}`);
        }
        const cssPath = path.join(componentPath, `${widgetName}.css`);
        const htmlPath = path.join(componentPath, `${widgetName}.html`);
        html = await fsPromises.readFile(htmlPath, 'utf8');
        css = await fsPromises.readFile(cssPath, 'utf8');

        return utils.sendResponse(res, 200, "application/json", {
            data: {html, css, presenterClassName: convertToPascalCase(widgetName)}
        });
    } catch (error) {
        return utils.sendResponse(res,500, "application/json");
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

async function loadApplicationFile(request, response, server) {
    function handleFileError(response, error) {
        // Log the detailed error for debugging purposes on the server
        console.error("File loading error:", error);
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
            sendResponse(response, 404, "application/json", {
                message: "File not found",
            });
        } else {
            sendResponse(response, 500, "application/json", {
                message: "Internal Server Error while loading file.",
            });
        }
    }

    try {
        const {spaceId, appName} = request.params;
        const filePath = request.url.split(`${appName}/`)[1];
        const appDirectoryPath = path.join(server.rootFolder, "external-volume", "spaces", spaceId, "applications", appName);
        const requestedFilePath = path.normalize(path.join(appDirectoryPath, filePath));
        const realAppDirectoryPath = await fsPromises.realpath(appDirectoryPath);
        const realRequestedFilePath = await fsPromises.realpath(requestedFilePath);
        //prevent path traversal attacks (e.g., ../../etc/passwd).
        if (!realRequestedFilePath.startsWith(realAppDirectoryPath + path.sep)) {
            return sendResponse(response, 403, "application/json", {
                message: "Forbidden: Access denied.",
            });
        }

        const fileType = path.extname(realRequestedFilePath).substring(1) || '';
        const imageTypes = ["png", "jpg", "jpeg", "gif", "ico"];
        const encoding = imageTypes.includes(fileType) ? null : "utf8"; // Use null encoding for binary files to get a Buffer
        const file = await fsPromises.readFile(realRequestedFilePath, encoding);
        response.setHeader('Cache-Control', 'public, max-age=10');
        return await sendFileToClient(response, file, fileType);
    } catch (error) {
        return handleFileError(response, error);
    }
}

async function getWebSkelConfig(req, res, server){
    let webSkelConfig = {}
    let defaultConfigPath = path.join(server.rootFolder, "wallet", "webskel-configs.json");
    let defaultConfig = await fsPromises.readFile(defaultConfigPath, "utf8");
    defaultConfig = JSON.parse(defaultConfig);
    for(let component of defaultConfig.components){
        component.directory = path.join(defaultConfig.webComponentsRootDir, component.directory);
    }
    webSkelConfig.components = defaultConfig.components;
    if(!req.sessionId){
        return utils.sendResponse(res, 200, "application/json", webSkelConfig);
    }
    let client = await getAPIClient(req, constants.ASSISTOS_ADMIN_PLUGIN);
    let spaceId = await client.getDefaultSpaceId(req.email);
    let appClient = await getAPIClient(req, constants.APPLICATION_PLUGIN, spaceId);
    let installedApps = await appClient.getApplications();
    for(let app of installedApps){
        try {
            let manifest = await appClient.getApplicationManifest(app.name);
            for(let component of manifest.webComponents){
                component.type = path.join("external-volume", "spaces", spaceId, "applications", app.name, "web-components");
            }
            webSkelConfig.components =  webSkelConfig.components.concat(manifest.webComponents);
        } catch (e) {
            console.error(e);
            continue;
        }

    }
    return utils.sendResponse(res, 200, "application/json", webSkelConfig);
}
module.exports = {
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
    getWidget,
    deleteSecret,
    importPersonality,
    listUserSpaces,
    restartServerless,
    installSystemApps,
    loadApplicationFile,
    getWebSkelConfig
}
