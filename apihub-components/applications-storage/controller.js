const {exec} = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs');
const path = require('path');
const fsPromises = require('fs').promises;
const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

function sendResponse(response, statusCode, contentType, message) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}

function updateSpaceStatus(spaceId, applicationName, branchName) {
    const statusPath = `../apihub-root/spaces/${spaceId}/status/status.json`;
    let status;
    if (fs.existsSync(statusPath)) {
        const fileContent = fs.readFileSync(statusPath, 'utf8');
        status = JSON.parse(fileContent);
    } else {
        status = {};
    }
    let installationDate = new Date();
    let lastUpdate = installationDate.toISOString();

    if (status.installedApplications) {
        status.installedApplications.push(
            {
                applicationId: applicationName,
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                spaceFlowsBranch: branchName
            });
    } else {
        status.installedApplications = [
            {
                applicationId: applicationName,
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                spaceFlowsBranch: branchName
            }
        ];
    }
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

function generateId() {
    const length = 12;
    let random = crypto.getRandomSecret(length);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = crypto.encodeBase58(random).slice(0, length);
    }
    return randomStringId;
}

async function installApplication(request, response) {
    const spaceId = request.params.spaceId;
    let applicationId = request.params.applicationId;
    try {
        const webSkelConfig = require("../apihub-root/wallet/webskel-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);
        const folderPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}`;
        if (!application || !application.repository) {
            console.error("Application or repository not found");
            sendResponse(response, 404, "text/html", "Application or repository not found")
        }
        await execAsync(`git clone ${application.repository} ${folderPath}`);

        const branchName = `space-${spaceId}`;
        if (application.flowsRepository) {
            let applicationPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}/flows`
            await execAsync(`git clone ${application.flowsRepository} ${applicationPath}`);
            await execAsync(`rm ${applicationPath}/README.md`);
            await execAsync(`git -C ${applicationPath} checkout -b ${branchName}`);
            await execAsync(`git -C ${applicationPath} push -u origin ${branchName}`);
        }
        updateSpaceStatus(spaceId, application.name, branchName);
        sendResponse(response, 200, "text/html", "Application installed successfully")
    } catch (error) {
        console.error("Error in installing application:", error);
        sendResponse(response, 500, "text/html", error)
    }
}

async function uninstallApplication(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const folderPath = `../apihub-root/spaces/${spaceId}/applications/${applicationId}`;
}

async function resetApplication(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const folderPath = `../apihub-root/spaces/${spaceId}/applications/${applicationId}`;
}
async function saveJSON(response, spaceData, filePath) {
    const folderPath = path.dirname(filePath);
    try{
        await fsPromises.access(filePath);
    }catch (e) {
        try {
            await fsPromises.mkdir(folderPath, { recursive: true });
        } catch(error) {
            sendResponse(response, 500, "text/html", error+ ` Error at creating folder: ${folderPath}`);
            return false;
        }
    }
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch(error) {
        sendResponse(response, 500, "text/html", error+ ` Error at writing space: ${filePath}`);
        return false;
    }
    return true;
}
async function storeObject(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const objectType = request.params.objectType;
    const objectId = request.params.objectId;
    const filePath = `../apihub-root/spaces/${spaceId}/applications/${applicationId}/${objectType}/${objectId}.json`;
    if(request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${objectId}`);
        return;
    }
    let jsonData = JSON.parse(request.body.toString());
    if(await saveJSON(response, JSON.stringify(jsonData), filePath)){
        sendResponse(response, 200, "text/html", `Success, ${objectId}`);
    }

}


async function loadApplicationConfig(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const applicationId = request.params.applicationId;

        const webSkelConfig = require("../apihub-root/wallet/webskel-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);

        const folderPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}`;
        const manifestPath = `${folderPath}/manifest.json`;

        const manifest = fs.readFileSync(manifestPath, 'utf8');
        sendResponse(response, 200, "application/json", manifest);
    } catch (error) {
        console.error('Error reading manifest:', error);
        sendResponse(response, 500, "text/plain", "Internal Server Error");
    }
}
async function loadObjects(filePath){
    let localData = [];
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return { file, stat };
    }).filter(stat => stat.file !== ".git");
    let fileStats = await Promise.all(statPromises);
    fileStats = fileStats.filter(stat => stat.file !== ".git");
    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
    for (const { file } of fileStats) {
        const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
        localData.push(JSON.parse(jsonContent));
    }
    return localData;
}
async function loadApplicationComponents(request, response) {
    try {
        const {spaceId, applicationName} = request.params;
        const baseUrl = `/app/${spaceId}/applications/${applicationName}/`;
        const componentPath = request.url.substring(baseUrl.length);

        const filePath = `../apihub-root/spaces/${spaceId}/applications/${applicationName}/${componentPath}`;
        console.log("File Path:", filePath);
        if(componentPath === "flows"){
            let flows = await loadObjects(filePath);
            return sendResponse(response, 200, "text/plain", JSON.stringify(flows));
        }
        // Security check TBD: Ensure that filePath is still within the intended directory and user has access to it

        const fileContent = await fsPromises.readFile(filePath, 'utf8');
        const fileType = path.extname(componentPath).slice(1); // get the extension of the file
        let contentType = "";

        switch (fileType) {
            case "js":
                contentType = "application/javascript";
                break;
            case "html":
                contentType = "text/html";
                break;
            case "css":
                contentType = "text/css";
                break;
            case"png":
                contentType = "image/png";
                break;
            case"jpg":
                contentType = "image/jpg";
                break;
            case "jpeg":
                contentType = "image/jpeg";
                break;
            case "svg":
                contentType = "image/svg+xml";
                break;
            case "gif":
                contentType = "image/gif";
                break;
            case "ico":
                contentType = "image/x-icon";
                break;
            case "json":
                contentType = "application/json";
                break;
            case "woff":
                contentType = "font/woff";
                break;
            default:
                return sendResponse(response, 500, "text/plain", "Internal Server Error, file type not supported");
        }
        sendResponse(response, 200, contentType, fileContent);
    } catch (error) {
        console.error('Error reading component:', error);
        if (error.code === 'ENOENT') {
            sendResponse(response, 404, "text/plain", "File not found");
        } else {
            sendResponse(response, 500, "text/plain", "Internal Server Error");
        }
    }
}

module.exports = {
    installApplication,
    uninstallApplication,
    resetApplication,
    storeObject,
    loadApplicationConfig,
    loadApplicationComponents
}