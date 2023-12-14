const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs');
const path = require('path');
const fsAsync = require('fs').promises;
const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");
function sendResponse(response, statusCode, contentType, message) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
function updateSpaceStatus(spaceId, applicationId, applicationName) {
    const statusPath = `../apihub-root/spaces/${spaceId}/status/status.json`;
    let status;
    if (fs.existsSync(statusPath)) {
        const fileContent = fs.readFileSync(statusPath, 'utf8');
        status = JSON.parse(fileContent);
    } else {
        status = {};
    }
   if(status.installedApplications){
         status.installedApplications.push({id:applicationId, name:applicationName});
   }else{
         status.installedApplications=[{id:applicationId, name:applicationName}];
   }
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}
function updateManifest  (manifestPath, spaceId, branchName, applicationId, applicationName){
    let manifest;

    if (fs.existsSync(manifestPath)) {
        const fileContent = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(fileContent);
    } else {
        manifest = {};
    }
    manifest.spaceId = spaceId;
    manifest.version = manifest.version || "0.0.1";
    manifest.flowsBranch = branchName;
    manifest.applicationId = applicationId;
    manifest.name = applicationName;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}
function generateId() {
    const length = 12;
    const randomBytes = new Uint8Array(length);
    crypto.generateRandom(randomBytes);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = this.crypto.encodeBase58(randomBytes).slice(0, length);
    }
    return randomStringId;
}

async function installApplication(request, response) {
    const spaceId = request.params.spaceId;
    let applicationId = request.params.applicationId;

    const branchName = `space-${spaceId}`;
    try {
        const webSkelConfig = require("../apihub-root/wallet/webskel-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);
        const folderPath =  `../apihub-root/spaces/${spaceId}/applications/${application.name}`;
        if (!application || !application.repository) {
            console.error("Application or repository not found");
            sendResponse(response, 404, "text/html", "Application or repository not found")
        }
        await execAsync(`git clone ${application.repository} ${folderPath}`);
        applicationId=generateId();
        updateManifest(`${folderPath}/manifest.json`, spaceId, branchName,applicationId,application.name);
        if(application.flowsRepository) {
            let applicationPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}/flows`
            await execAsync(`git clone ${application.flowsRepository} ${applicationPath}`);
            await execAsync(`rm ${applicationPath}/README.md`);
            await execAsync(`git -C ${applicationPath} checkout -b ${branchName}`);
            await execAsync(`git -C ${applicationPath} push -u origin ${branchName}`);
        }
        updateSpaceStatus(spaceId, applicationId,application.name);
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

async function updateApplicationFlow(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const flowId = request.params.flowId;
    const folderPath = `../apihub-root/spaces/${spaceId}/applications/${applicationId}/flows/${flowId}`;

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
async function loadApplicationComponents(request, response) {
    try {
        const { spaceId, applicationName } = request.params;
        const baseUrl = `/app/${spaceId}/applications/${applicationName}/`;
        const componentPath = request.url.substring(baseUrl.length);

        const filePath = `../apihub-root/spaces/${spaceId}/applications/${applicationName}/${componentPath}`;
        console.log("File Path:", filePath);
        // Security check TBD: Ensure that filePath is still within the intended directory and user has access to it

        const fileContent = await fsAsync.readFile(filePath, 'utf8');
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
    updateApplicationFlow,
    loadApplicationConfig,
    loadApplicationComponents
}