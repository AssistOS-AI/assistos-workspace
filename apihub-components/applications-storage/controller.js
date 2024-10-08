const {exec} = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');
const fsPromises = require('fs').promises;
const {sendResponse,sendFileToClient} = require('../apihub-component-utils/utils.js')
const crypto = require('../apihub-component-utils/crypto.js');
const dataVolumePaths = require('../volumeManager').paths;
const Space=require('../spaces-storage/space.js');

async function updateSpaceStatus(spaceId, applicationName, description, deleteMode = false) {
    const statusPath = path.join(dataVolumePaths.space,`${spaceId}/status/status.json`);
    let status;
    try {
        await fsPromises.access(statusPath);
        const fileContent = await fsPromises.readFile(statusPath, 'utf8');
        status = JSON.parse(fileContent);
    } catch (e) {
        status = {};
    }
    if (deleteMode === true) {
        status.installedApplications = status.installedApplications.filter(app => app.id !== applicationName);
        await fsPromises.writeFile(statusPath, JSON.stringify(status, null, 2));
        return;
    }
    let installationDate = new Date();
    let lastUpdate = installationDate.toISOString();

    if (status.installedApplications) {
        status.installedApplications.push(
            {
                name: applicationName,
                id: crypto.generateId(),
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                description: description
            });
    } else {
        status.installedApplications = [
            {
                name: applicationName,
                id: crypto.generateId(),
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                description: description
            }
        ];
    }
    await fsPromises.writeFile(statusPath, JSON.stringify(status, null, 2));
}

async function iterateFolder(folderPath, extensions) {
    let filePaths = [];
    let files = await fsPromises.readdir(folderPath, {withFileTypes: true});
    for (let dirent of files) {
        const fullPath = path.join(folderPath, dirent.name);
        if (dirent.isDirectory()) {
            filePaths = filePaths.concat(await iterateFolder(fullPath, extensions));
        } else if (dirent.isFile() && extensions.includes(path.extname(dirent.name))) {
            filePaths.push(fullPath);
        }
    }
    return filePaths;
}

async function processFile(filePath, applicationId, components) {
    let content = await fsPromises.readFile(filePath, 'utf8');
    components = components.sort((a, b) => b.name.length - a.name.length);
    components.forEach((component, index) => {
        const uniqueMarker = `TEMP_MARKER_${index}_`;
        const searchStr = new RegExp(`\\b${component.name}\\b`, 'g');
        content = content.replace(searchStr, uniqueMarker);
    });
    components.forEach((component, index) => {
        const uniqueMarker = `TEMP_MARKER_${index}_`;
        const replaceStr = `${applicationId}-${component.name}`;
        content = content.replace(new RegExp(uniqueMarker, 'g'), replaceStr);
    });
    await fsPromises.writeFile(filePath, content, 'utf8');
}

async function installApplication(request, response) {
    const spaceId = request.params.spaceId;
    let applicationId = request.params.applicationId;

    try {
        const applications = require("./applications.json");
        const application = applications.find(app => app.id === applicationId);
        const folderPath = path.join(dataVolumePaths.space,`${spaceId}/applications/${application.name}`);
        if (!application || !application.repository) {
            console.error("Application or repository not found");
            sendResponse(response, 404, "application/json", {
                message: "Application or repository not found",
                success: false
            });
            return;
        }
        await execAsync(`git clone ${application.repository} ${folderPath}`);

        let manifestPath = folderPath + "/" + "manifest.json";
        let manifest = JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));


        // const extensions = ['.html', '.css', '.js'];
        //
        // const filePaths = await iterateFolder(folderPath, extensions);
        // applicationId = applicationId.toLowerCase();
        // let promisesArray = []
        // filePaths.forEach(filePath => {
        //     promisesArray.push(processFile(filePath, applicationId, manifest.components));
        // })
        // await Promise.all(promisesArray)
        // for (let component of manifest.components) {
        //     component.name = `${applicationId}-` + component.name;
        // }
        //
        // manifest.entryPointComponent = `${applicationId}-` + manifest.entryPointComponent;
        //
        // await fsPromises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

        if (application.flowsRepository) {
            const applicationPath = path.join(dataVolumePaths.space,`${spaceId}/applications/${application.name}/flows`);
            await execAsync(`git clone ${application.flowsRepository} ${applicationPath}`);
            try {
                await execAsync(`rm ${applicationPath}/README.md`);
            }catch(error){}
        }
        await updateSpaceStatus(spaceId, application.name, manifest.description);
        sendResponse(response, 200, "application/json", {
            message: "Application installed successfully",
            success: true
        });
    } catch (error) {
        console.error("Error in installing application:", error);
        sendResponse(response, 500, "application/json", {
            message: error.toString(),
            success: false
        });
    }
}

async function uninstallApplication(request,response) {
    const spaceId=request.params.spaceId;
    const applicationId=request.params.applicationId;
    try {
        await Space.APIs.uninstallApplication(spaceId, applicationId);
        sendResponse(response, 200, "application/json", {
            message: "Application uninstalled successfully",
            success: true
        });
    }catch(error){
        sendResponse(response, 500, "application/json", {
            message: "Application or repository not found",
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

async function storeObject(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const objectType = request.params.objectType;
    const objectId = decodeURIComponent(request.params.objectId);
    const filePath = path.join(dataVolumePaths.space,`${spaceId}/applications/${applicationId}/${objectType}/${objectId}.json`);
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
async function loadApplicationsMetadata(request, response) {
    try {
        const applications = require("./applications.json");
        sendResponse(response, 200, "application/json", {
            message: "",
            success: true,
            data: applications
        });
    } catch (error) {
        console.error('Error reading applications metadata:', error);
        sendResponse(response, 500, "application/json", {
            message: "Internal Server Error",
            success: false
        });
    }
}
async function loadApplicationConfig(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const applicationId = request.params.applicationId;

        const applications = require("./applications.json");
        const application = applications.find(app => app.id === applicationId);

        const folderPath = path.join(dataVolumePaths.space,`${spaceId}/applications/${application.name}`);
        const manifestPath = `${folderPath}/manifest.json`;

        const manifest = await fsPromises.readFile(manifestPath, 'utf8');
        sendResponse(response, 200, "application/json", {
            message: "",
            success: true,
            data: JSON.parse(manifest)
        });
    } catch (error) {
        console.error('Error reading manifest:', error);
        sendResponse(response, 500, "application/json", {
            message: "Internal Server Error",
            success: false
        });
    }
}

async function loadObjects(request, response) {
    const filePath = path.join(dataVolumePaths.space,`${request.params.spaceId}/applications/${request.params.appName}/${request.params.objectType}`);
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
    try {
        const {spaceId, applicationName} = request.params;
        const baseUrl = `/app/${spaceId}/applications/${applicationName}/file/`
        const relativeFilePath = request.url.substring(baseUrl.length);

        const fileType = relativeFilePath.substring(relativeFilePath.lastIndexOf('.') + 1) || '';
        const filePath = path.join(dataVolumePaths.space,`${spaceId}/applications/${applicationName}/${relativeFilePath}`);
        const file = await fsPromises.readFile(filePath, 'utf8');
        await sendFileToClient(response, file, fileType);
    } catch (error) {
        console.error('Error reading component:', error);
        handleFileError(response, error);
    }
}

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
async function storeAppFlow(request, response) {
    let objectId = decodeURIComponent(request.params.objectId);
    const filePath = path.join(dataVolumePaths.space,`${request.params.spaceId}/applications/${request.params.applicationId}/flows/${objectId}.js`);
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
    const filePath = path.join(dataVolumePaths.space,`${request.params.spaceId}/applications/${request.params.applicationId}/flows`);
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
    storeAppFlow
}
