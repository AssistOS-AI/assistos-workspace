const {exec} = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const path = require('path');
const fsPromises = require('fs').promises;

const requestUtils = require('../apihub-component-utils/utils.js')

const sendResponse = requestUtils.sendResponse
const sendFileToClient = requestUtils.sendFileToClient


function createContainerName(spaceId, userId) {
    return `${spaceId}.${userId}`;
}

async function getSecret(spaceId, userId, secretName, serverRootFolder) {
    let containerName = createContainerName(spaceId, userId);
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(serverRootFolder);
    return secretsService.getSecretSync(containerName, secretName);
}

async function updateSpaceStatus(spaceId, applicationName, description, deleteMode = false) {
    const statusPath = `../data-volume/spaces/${spaceId}/status/status.json`;
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
                id: Manager.apis.generateId(),
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                description: description
            });
    } else {
        status.installedApplications = [
            {
                name: applicationName,
                id: Manager.apis.generateId(),
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
        const assistOSConfig = require("../apihub-root/assistOS-configs.json");
        const application = assistOSConfig.applications.find(app => app.id == applicationId);
        const folderPath = `../data-volume/spaces/${spaceId}/applications/${application.name}`;
        if (!application || !application.repository) {
            console.error("Application or repository not found");
            sendResponse(response, 404, "text/html", "Application or repository not found");
            return;
        }
        await execAsync(`git clone ${application.repository} ${folderPath}`);

        let manifestPath = folderPath + "/" + "manifest.json";
        let manifest = JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));


        const extensions = ['.html', '.css', '.js'];

        const filePaths = await iterateFolder(folderPath, extensions);
        applicationId = applicationId.toLowerCase();
        let promisesArray = []
        filePaths.forEach(filePath => {
            promisesArray.push(processFile(filePath, applicationId, manifest.components));
        })
        await Promise.all(promisesArray)
        for (let component of manifest.components) {
            component.name = `${applicationId}-` + component.name;
        }

        manifest.entryPointComponent = `${applicationId}-` + manifest.entryPointComponent;

        await fsPromises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

        if (application.flowsRepository) {
            let applicationPath = `../data-volume/spaces/${spaceId}/applications/${application.name}/flows`;
            await execAsync(`git clone ${application.flowsRepository} ${applicationPath}`);
            await execAsync(`rm ${applicationPath}/README.md`);
        }
        //await clearGITCredentialsCache();
        //await execAsync(`git pull`);
        await updateSpaceStatus(spaceId, application.name, manifest.description);
        sendResponse(response, 200, "text/html", "Application installed successfully");
    } catch (error) {
        console.error("Error in installing application:", error);
        sendResponse(response, 500, "text/html", error.toString());
    }
}

async function uninstallApplication(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const folderPath = `../data-volume/spaces/${spaceId}/applications/${applicationId}`;
    try {
        const assistOSConfigs = require("../apihub-root/assistOS-configs.json");
        const application = assistOSConfigs.applications.find(app => app.id === applicationId);

        // Check for the application's existence
        if (!application) {
            console.error("Application not found");
            sendResponse(response, 404, "text/html", "Application not found");
            return;
        }

        if (application.flowsRepository) {
            let flowsPath = `../data-volume/spaces/${spaceId}/applications/${application.name}/flows`;

            // Check if the flows directory exists
            try {
                await fsPromises.access(flowsPath);
                // If it exists, delete the branch
                const branchName = `space-${spaceId}`;
                await execAsync(`git -C ${flowsPath} push origin --delete ${branchName}`);
            } catch (dirError) {
                console.error("Flows directory does not exist, skipping branch deletion:", dirError);
            }
        }

        // Remove the application folder
        await execAsync(`rm -rf ${folderPath}`);
        //await clearGITCredentialsCache();
        updateSpaceStatus(spaceId, application.name, "", "", true);
        sendResponse(response, 200, "text/html", "Application uninstalled successfully");
    } catch (error) {
        console.error("Error in uninstalling application:", error);
        sendResponse(response, 500, "text/html", error.toString());
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
            sendResponse(response, 500, "text/html", error + ` Error at creating folder: ${folderPath}`);
            return false;
        }
    }
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch (error) {
        sendResponse(response, 500, "text/html", error + ` Error at writing space: ${filePath}`);
        return false;
    }
    return true;
}

async function storeObject(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const objectType = request.params.objectType;
    const objectId = decodeURIComponent(request.params.objectId);
    const filePath = `../data-volume/spaces/${spaceId}/applications/${applicationId}/${objectType}/${objectId}.json`;
    if (request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${objectId}`);
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    if (await saveJSON(response, JSON.stringify(jsonData), filePath)) {
        sendResponse(response, 200, "text/html", `Success, ${objectId}`);
    }

}

async function loadApplicationConfig(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const applicationId = request.params.applicationId;

        const assistOSConfig = require("../apihub-root/assistOS-configs.json");
        const application = assistOSConfig.applications.find(app => app.id == applicationId);

        const folderPath = `../data-volume/spaces/${spaceId}/applications/${application.name}`;
        const manifestPath = `${folderPath}/manifest.json`;

        const manifest = await fsPromises.readFile(manifestPath, 'utf8');
        sendResponse(response, 200, "application/json", manifest);
    } catch (error) {
        console.error('Error reading manifest:', error);
        sendResponse(response, 500, "text/plain", "Internal Server Error");
    }
}

async function loadObjects(request, response) {
    let filePath = `../data-volume/spaces/${request.params.spaceId}/applications/${request.params.appName}/${request.params.objectType}`;
    try {
        await fsPromises.access(filePath);
    } catch (e) {
        try {
            await fsPromises.mkdir(filePath, {recursive: true});
        } catch (error) {
            return sendResponse(response, 500, "text/html", error + ` Error at creating folder: ${filePath}`);
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
        sendResponse(response, 500, "text/plain", JSON.stringify(e));
    }

    sendResponse(response, 200, "application/json", JSON.stringify(localData));
}

async function loadApplicationFile(request, response) {
    try {
        const {spaceId, applicationName} = request.params;
        const baseUrl = `/app/${spaceId}/applications/${applicationName}/file/`
        const relativeFilePath = request.url.substring(baseUrl.length);

        const fileType = relativeFilePath.substring(relativeFilePath.lastIndexOf('.') + 1) || '';

        const filePath = `../data-volume/spaces/${spaceId}/applications/${applicationName}/${relativeFilePath}`;
        const file = await fsPromises.readFile(filePath, 'utf8');
        await sendFileToClient(response, file, fileType);
    } catch (error) {
        console.error('Error reading component:', error);
        handleFileError(response, error);
    }
}

function handleFileError(response, error) {
    if (error.code === 'ENOENT') {
        sendResponse(response, 404, "text/plain", "File not found");
    } else {
        sendResponse(response, 500, "text/plain", "Internal Server Error");
    }
}


/*async function loadApplicationComponent(request, response) {
    try {
        let {spaceId, applicationName, componentName,fileType} = request.params;
        let index = componentName.indexOf("-");
        componentName=componentName.substring(index + 1);
        const componentFilePath = `../apihub-root/spaces/${spaceId}/applications/${applicationName}/web-components/${componentName}/${componentName + '.' + fileType}`;
        await sendFileToClient(response, componentFilePath, fileType);
    }catch(error){
        console.error('Error reading component:', error);
        handleFileError(response,error)
    }
}*/

module.exports = {
    installApplication,
    uninstallApplication,
    storeObject,
    loadApplicationConfig,
    loadApplicationFile,
    loadObjects,
}