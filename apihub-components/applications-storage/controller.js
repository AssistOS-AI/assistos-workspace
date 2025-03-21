const path = require('path');
const fsPromises = require('fs').promises;
const {sendResponse, sendFileToClient} = require('../apihub-component-utils/utils.js')
const dataVolumePaths = require('../volumeManager').paths;
const subscriptionManager = require('../subscribers/SubscriptionManager.js');
const constants = require('../space/constants');
function getApplicationAPIClient(userId){
    return require("opendsu").loadAPI("serverless").createServerlessAPIClient(userId, process.env.BASE_URL, constants.GLOBAL_SERVERLESS_ID, constants.APPLICATION_PLUGIN);
}
async function installApplication(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        await client.installApplication(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", {
            message: `Application ${applicationId} installed successfully in space ${spaceId}`,
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message,
        });
    }
}

async function uninstallApplication(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        await client.uninstallApplication(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", {
            message: "Application uninstalled successfully",
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to uninstall Application: ${error}`,
        });
    }
}

async function updateApplication(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        await client.updateApplication(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", {
            message: "Application updated successfully",
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to update Application: ${error}`,
        });
    }
}

async function requiresUpdate(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        const needsUpdate = await client.requiresUpdate(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", needsUpdate);
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to check for updates: ${error}`,
        });
    }
}

async function saveJSON(response, spaceData, filePath) {
    const folderPath = path.dirname(filePath);
    try {
        await fsPromises.access(filePath);
    } catch (e) {
        try {
            await fsPromises.mkdir(folderPath, {recursive: true});
        } catch (error) {
            sendResponse(response, 500, "application/json", {
                message: error + ` Error at creating folder: ${folderPath}`,
            });
            return false;
        }
    }
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            message: error + ` Error at writing file: ${filePath}`,
        });
        return false;
    }
    return true;
}


async function loadApplicationsMetadata(request, response) {
    try {
        let client = getApplicationAPIClient(request.userId);
        const applicationsMetadata = await client.loadApplicationsMetadata();
        return sendResponse(response, 200, "application/json", applicationsMetadata);
    } catch (error) {
        return sendResponse(response, 500, "application/json", {
            message: `Failed to load applications metadata: ${error}`,
        });
    }
}

async function loadApplicationConfig(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        const applicationManifest = await client.loadApplicationConfig(spaceId, applicationId);
        response.setHeader('Cache-Control', 'public, max-age=10');
        return sendResponse(response, 200, "application/json", applicationManifest);
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to load application config:${error}`,
        });
    }
}

async function getApplicationTasks(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        const tasks = await client.getApplicationTasks(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", tasks);
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to get application tasks:${error}`,
        });
    }
}

async function runApplicationTask(request, response) {
    const {spaceId, applicationId, taskName} = request.params;
    try {
        const taskData = request.body;
        let client = getApplicationAPIClient(request.userId);
        const taskId = await client.runApplicationTask(request, spaceId, applicationId, taskName, taskData);
        const sessionId = request.sessionId;
        subscriptionManager.notifyClients(sessionId, applicationId, "tasks");
        return sendResponse(response, 200, "text/plain", taskId);
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to run application task:${error}`,
        });
    }
}

async function runApplicationFlow(request, response) {
    const {spaceId, applicationId, flowId} = request.params;
    try {
        request.setTimeout(0);
        const flowData = request.body;
        let client = getApplicationAPIClient(request.userId);
        const data = await client.runApplicationFlow(request, spaceId, applicationId, flowId, flowData);
        const sessionId = request.sessionId;
        subscriptionManager.notifyClients(sessionId, applicationId, "flows");
        return sendResponse(response, 200, "application/json", data);
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to run application flow:${error}`,
        });
    }
}

async function storeObject(request, response) {
    const {spaceId, applicationId, objectType} = request.params
    const objectId = decodeURIComponent(request.params.objectId);
    const filePath = path.join(dataVolumePaths.space, `${spaceId}/applications/${applicationId}/${objectType}/${objectId}.json`);
    if (request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "application/json", {
            message: "Deleted successfully " + objectId,
        });
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    if (await saveJSON(response, JSON.stringify(jsonData), filePath)) {
        sendResponse(response, 200, "application/json", {
            message: `Success, write ${objectId}`,
        });
    }
}

async function loadObjects(request, response) {
    const filePath = path.join(dataVolumePaths.space, `${request.params.spaceId}/applications/${request.params.appName}/${request.params.objectType}`);
    try {
        await fsPromises.access(filePath);
    } catch (e) {
        try {
            await fsPromises.mkdir(filePath, {recursive: true});
        } catch (error) {
            return sendResponse(response, 500, "application/json", {
                message: error + ` Error at creating folder: ${filePath}`,
            });
        }
    }
    let localData = [];
    try {
        const files = await fsPromises.readdir(filePath);
        const statPromises = files.map(async (file) => {
            const fullPath = path.join(filePath, file);
            const stat = await fsPromises.stat(fullPath);
            if (file.toLowerCase() !== ".git" && !file.toLowerCase().includes("license")) {
                return {file, stat};
            }
        });

        let fileStats = await Promise.all(statPromises);

        fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
        for (const {file} of fileStats) {
            const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
            localData.push(JSON.parse(jsonContent));
        }
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: JSON.stringify(e),
        });
    }

    sendResponse(response, 200, "application/json", localData);
}

async function loadApplicationFile(request, response) {
    function handleFileError(response, error) {
        if (error.code === 'ENOENT') {
            sendResponse(response, 404, "application/json", {
                message: "File not found",
            });
        } else {
            sendResponse(response, 500, "application/json", {
                message: "Internal Server Error",
            });
        }
    }

    try {
        let {spaceId, applicationId} = request.params;

        const filePath = request.url.split(`${applicationId}/`)[1];
        const fullPath = path.join(dataVolumePaths.space, `${spaceId}/applications/${applicationId}/${filePath}`);

        const fileType = filePath.substring(filePath.lastIndexOf('.') + 1) || '';
        let defaultOptions = "utf8";
        let imageTypes = ["png", "jpg", "jpeg", "gif", "ico"];
        if (imageTypes.includes(fileType)) {
            defaultOptions = "";
        }
        const file = await fsPromises.readFile(fullPath, defaultOptions);
        response.setHeader('Cache-Control', 'public, max-age=10');
        return await sendFileToClient(response, file, fileType);
    } catch (error) {
        return handleFileError(response, error);
    }
}

async function storeAppFlow(request, response) {
    let objectId = decodeURIComponent(request.params.objectId);
    const filePath = path.join(dataVolumePaths.space, `${request.params.spaceId}/applications/${request.params.applicationId}/flows/${objectId}.js`);
    if (request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "application/json", {
            message: "Deleted successfully " + objectId,
        });
        return;
    }
    let data = request.body.toString();
    try {
        await fsPromises.writeFile(filePath, data, 'utf8');
    } catch (error) {
        return sendResponse(response, 500, "application/json", {
            message: error + ` Error at writing file: ${filePath}`,
        });
    }
    return sendResponse(response, 200, "application/json", {
        message: `Success, write ${objectId}`,
    });
}

async function loadAppFlows(request, response) {
    const filePath = path.join(dataVolumePaths.space, `${request.params.spaceId}/applications/${request.params.applicationId}/flows`);
    let flows = await loadObjects(filePath);
    return sendResponse(response, 200, "application/javascript", flows);
}

async function getApplicationsPlugins(request, response) {
    const {spaceId} = request.params;
    try {
        let client = getApplicationAPIClient(request.userId);
        const plugins = await client.getApplicationsPlugins(spaceId);
        return sendResponse(response, 200, "application/json", plugins);
    } catch (error) {
        return sendResponse(response, 500, "application/json", {
            message: `Failed to get applications plugins: ${error}`,
        });
    }
}

async function getWidgets(request, response) {
    const {spaceId} = request.params;
    if (!spaceId) {
        return sendResponse(response, 400, "application/json", {
            message: "SpaceId is required",
        });
    }
    try {
        let client = getApplicationAPIClient(request.userId);
        const widgets = await client.getWidgets(spaceId);
        return sendResponse(response, 200, "application/json", widgets);
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to get widgets: ${error}`,
        });
    }
}

module.exports = {
    getWidgets,
    loadApplicationsMetadata,
    installApplication,
    uninstallApplication,
    storeObject,
    loadApplicationConfig,
    loadApplicationFile,
    loadObjects,
    loadAppFlows,
    storeAppFlow,
    runApplicationTask,
    runApplicationFlow,
    requiresUpdate,
    updateApplication,
    getApplicationTasks,
    getApplicationsPlugins
}
