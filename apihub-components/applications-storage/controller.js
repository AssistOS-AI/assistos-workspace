const path = require('path');
const fsPromises = require('fs').promises;
const {sendResponse, sendFileToClient} = require('../apihub-component-utils/utils.js')
const dataVolumePaths = require('../volumeManager').paths;
const eventPublisher = require('../subscribers/eventPublisher.js');
const ApplicationHandler = require("./handler.js");

async function installApplication(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        await ApplicationHandler.installApplication(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", {
            message: `Application ${applicationId} installed successfully in space ${spaceId}`,
            success: true
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to install application. Error:` + error.message,
            success: false
        });
    }
}

async function uninstallApplication(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        await ApplicationHandler.uninstallApplication(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", {
            message: "Application uninstalled successfully",
            success: true
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to uninstall Application: ${error}`,
            success: false
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
                success: false
            });
            return false;
        }
    }
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            message: error + ` Error at writing file: ${filePath}`,
            success: false
        });
        return false;
    }
    return true;
}


async function loadApplicationsMetadata(request, response) {
    try {
        const applicationsMetadata = await ApplicationHandler.getApplicationsMetadata();
        return sendResponse(response, 200, "application/json", {
            success: true,
            data: applicationsMetadata
        });
    } catch (error) {
        return sendResponse(response, 500, "application/json", {
            message: `Failed to load applications metadata: ${error}`,
            success: false
        });
    }
}

async function loadApplicationConfig(request, response) {
    const {spaceId, applicationId} = request.params;
    try {
        const applicationManifest = await ApplicationHandler.loadApplicationConfig(spaceId, applicationId);
        return sendResponse(response, 200, "application/json", {
            message: "",
            success: true,
            data: applicationManifest
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to load application config:${error}`,
            success: false
        });
    }
}
async function runApplicationTask(request, response) {
    const {spaceId, applicationId, taskName} = request.params;
    try {
        const taskData = request.body;
        const taskId = await ApplicationHandler.runApplicationTask(request, spaceId, applicationId, taskName, taskData);
        const sessionId = request.sessionId;
        eventPublisher.notifyClients(sessionId, applicationId, "tasks");
        return sendResponse(response, 200, "application/json", {
            message: `Task ${taskId} started`,
            data: taskId,
            success: true
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to run application task:${error}`,
            success: false
        });
    }
}
async function runApplicationFlow(request, response) {
    const {spaceId, applicationId, flowId} = request.params;
    try {
        const flowData = request.body;
        const data = await ApplicationHandler.runApplicationFlow(request, spaceId, applicationId, flowId, flowData);
        const sessionId = request.sessionId;
        eventPublisher.notifyClients(sessionId, applicationId, "flows");
        return sendResponse(response, 200, "application/json", {
            message: `Flow executed successfully`,
            data: data,
            success: true
        });
    } catch (error) {
        return sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Failed to run application flow:${error}`,
            success: false
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
            success: true
        });
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    if (await saveJSON(response, JSON.stringify(jsonData), filePath)) {
        sendResponse(response, 200, "application/json", {
            message: `Success, write ${objectId}`,
            success: true
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
                success: false
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
            success: false
        });
    }

    sendResponse(response, 200, "application/json", {
        message: "Application or repository not found",
        success: true,
        data: localData
    });
}
async function loadApplicationFile(request, response) {
    function handleFileError(response, error) {
        if (error.code === 'ENOENT') {
            sendResponse(response, 404, "application/json", {
                message: "File not found",
                success: false
            });
        } else {
            sendResponse(response, 500, "application/json", {
                message: "Internal Server Error",
                success: false
            });
        }
    }

    try {
        let {spaceId, applicationId} = request.params;

        const filePath = request.url.split(`${applicationId}/`)[1];
        const fullPath = path.join(dataVolumePaths.space, `${spaceId}/applications/${applicationId}/${filePath}`);

        const fileType = filePath.substring(filePath.lastIndexOf('.') + 1) || '';
        const file = await fsPromises.readFile(fullPath, 'utf8');
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
            success: true
        });
        return;
    }
    let data = request.body.toString();
    try {
        await fsPromises.writeFile(filePath, data, 'utf8');
    } catch (error) {
        return sendResponse(response, 500, "application/json", {
            message: error + ` Error at writing file: ${filePath}`,
            success: false
        });
    }
    return sendResponse(response, 200, "application/json", {
        message: `Success, write ${objectId}`,
        success: true
    });
}

async function loadAppFlows(request, response) {
    const filePath = path.join(dataVolumePaths.space, `${request.params.spaceId}/applications/${request.params.applicationId}/flows`);
    let flows = await loadObjects(filePath);
    return sendResponse(response, 200, "application/javascript", flows);
}

module.exports = {
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
    runApplicationFlow
}
