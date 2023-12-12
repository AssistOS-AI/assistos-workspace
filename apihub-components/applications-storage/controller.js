const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const fs = require('fs');
const path = require('path');

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
async function installApplication(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;

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

module.exports = {
    installApplication,
    uninstallApplication,
    resetApplication,
    updateApplicationFlow
}