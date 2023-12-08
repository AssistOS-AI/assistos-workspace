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

async function installApplication(request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const folderPath = path.join(__dirname, `../apihub-root/spaces/${spaceId}/applications/${applicationId}`);
    const branchName = `space-${spaceId}-app-${applicationId}`;

    try {
        const webSkelConfig = require("../apihub-root/wallet/webskel-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);

        if (!application || !application.repository) {
            console.error("Application or repository not found");
            sendResponse(response, 404, "text/html", "Application or repository not found")
        }

        // Clone the repository
        await execAsync(`git clone ${application.repository} ${folderPath}`);

        // Change working directory to the cloned repository and create a new branch
        await execAsync(`git checkout -b ${branchName}`, { cwd: folderPath });

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