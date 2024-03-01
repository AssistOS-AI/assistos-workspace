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
function createContainerName(spaceId, userId){
    return `${spaceId}.${userId}`;
}

async function getSecret(spaceId, userId, secretName, serverRootFolder){
    let containerName = createContainerName(spaceId, userId);
    const secretsService = await require('apihub').getSecretsServiceInstanceAsync(serverRootFolder);
    return secretsService.getSecretSync(containerName, secretName);
}
function updateSpaceStatus(spaceId, applicationName, description, branchName, deleteMode=false) {
    const statusPath = `../apihub-root/spaces/${spaceId}/status/status.json`;
    let status;
    if (fs.existsSync(statusPath)) {
        const fileContent = fs.readFileSync(statusPath, 'utf8');
        status = JSON.parse(fileContent);
    } else {
        status = {};
    }
    if(deleteMode===true) {
        status.installedApplications = status.installedApplications.filter(app => app.id !== applicationName);
        fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
        return;
    }
    let installationDate = new Date();
    let lastUpdate = installationDate.toISOString();

    if (status.installedApplications) {
        status.installedApplications.push(
            {
                name: applicationName,
                id: generateId(),
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                flowsBranch: branchName,
                description: description
            });
    } else {
        status.installedApplications = [
            {
                name: applicationName,
                id: generateId(),
                installationDate: installationDate,
                lastUpdate: lastUpdate,
                flowsBranch: branchName,
                description: description
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

function iterateFolder(folderPath, extensions) {
    let filePaths = [];
    fs.readdirSync(folderPath, { withFileTypes: true }).forEach(dirent => {
        const fullPath = path.join(folderPath, dirent.name);
        if (dirent.isDirectory()) {
            filePaths = filePaths.concat(iterateFolder(fullPath, extensions));
        } else if (dirent.isFile() && extensions.includes(path.extname(dirent.name))) {
            filePaths.push(fullPath);
        }
    });
    return filePaths;
}
async function processFile(filePath, applicationId, components) {
    let content = await fsPromises.readFile(filePath, 'utf8');
    components = components.sort((a, b) => b.componentName.length - a.componentName.length);
    components.forEach((component, index) => {
        const uniqueMarker = `TEMP_MARKER_${index}_`;
        const searchStr = new RegExp(`\\b${component.componentName}\\b`, 'g');
        content= content.replace(searchStr, uniqueMarker);
    });
    components.forEach((component, index) => {
        const uniqueMarker = `TEMP_MARKER_${index}_`;
        const replaceStr = `${applicationId}-${component.componentName}`;
        content = content.replace(new RegExp(uniqueMarker, 'g'), replaceStr);
    });
    await fsPromises.writeFile(filePath, content, 'utf8');
}

async function setGITCredentialsCache(spaceId, userId, serverRootFolder){
    let username;
    let token;
    try {
        username = await getSecret(spaceId, userId, "username", serverRootFolder);
        token = await getSecret(spaceId, userId, "token", serverRootFolder);
    }
    catch (e){
      return 404;
    }
    const timeout = "60";
    await execAsync(`git config --global credential.helper 'cache --timeout=${timeout}'`);
    await execAsync(`echo "protocol=https\nhost=github.com\nusername=${username}\npassword=${token}\n" | git credential approve`);
    return 200;
}
async function clearGITCredentialsCache(){
    await execAsync(`git credential-cache exit`);
}
async function installApplication(server, request, response) {
    const spaceId = request.params.spaceId;
    let applicationId = request.params.applicationId;
    // let userId = request.params.userId;
    //
    // let result = await setGITCredentialsCache(spaceId, userId, server.rootFolder);
    // if(result === 404){
    //     return sendResponse(response, 404, "text/plain", "Credentials not found for current user");
    // }

    try {
        debugger
        const webSkelConfig = require("../apihub-root/wallet/assistOS-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);
        const folderPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}`;
        if (!application || !application.repository) {
            console.error("Application or repository not found");
            sendResponse(response, 404, "text/html", "Application or repository not found");
            return;
        }
        await execAsync(`git clone ${application.repository} ${folderPath}`);

        let manifestPath=folderPath+"/"+ "manifest.json";
        let manifest=JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));


        const extensions = ['.html', '.css', '.js'];

        const filePaths = iterateFolder(folderPath, extensions);
        applicationId=applicationId.toLowerCase();
        let promisesArray=[]
        filePaths.forEach(filePath => {
               promisesArray.push(processFile(filePath,applicationId,manifest.components));
            })
        await Promise.all(promisesArray)
        for (let component of manifest.components){
            component.componentName=`${applicationId}-`+component.componentName;
        }
        manifest.entryPointComponent=`${applicationId}-`+manifest.entryPointComponent;
        for(let presenter of manifest.presenters){
            presenter.forComponent=`${applicationId}-`+presenter.forComponent;
        }
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

        const branchName = `space-${spaceId}`;
        if (application.flowsRepository) {
            let applicationPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}/flows`;
            await execAsync(`git clone ${application.flowsRepository} ${applicationPath}`);
            await execAsync(`rm ${applicationPath}/README.md`);


            const { stdout: branchList } = await execAsync(`git -C ${applicationPath} branch -r`);
            if (branchList.includes(`origin/${branchName}`)) {
                await execAsync(`git -C ${applicationPath} checkout ${branchName}`);
            } else {
                await execAsync(`git -C ${applicationPath} checkout -b ${branchName}`);
                await execAsync(`git -C ${applicationPath} push -u origin ${branchName}`);
            }
        }
        //await clearGITCredentialsCache();
        await execAsync(`git pull`);
        updateSpaceStatus(spaceId, application.name, manifest.description, branchName);
        sendResponse(response, 200, "text/html", "Application installed successfully");
    } catch (error) {
        console.error("Error in installing application:", error);
        sendResponse(response, 500, "text/html", error.toString());
    }
}

async function uninstallApplication(server, request, response) {
    const spaceId = request.params.spaceId;
    const applicationId = request.params.applicationId;
    const folderPath = `../apihub-root/spaces/${spaceId}/applications/${applicationId}`;
    // let userId = request.params.userId;
    // let result = await setGITCredentialsCache(spaceId, userId, server.rootFolder);
    // if(result === 404){
    //     return sendResponse(response, 404, "text/plain", "Credentials not found for current user");
    // }
    try {
        const webSkelConfig = require("../apihub-root/wallet/webskel-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);

        // Check for the application's existence
        if (!application) {
            console.error("Application not found");
            sendResponse(response, 404, "text/html", "Application not found");
            return;
        }

        if (application.flowsRepository) {
            let flowsPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}/flows`;

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
        updateSpaceStatus(spaceId, application.name, "", "",true);
        sendResponse(response, 200, "text/html", "Application uninstalled successfully");
    } catch (error) {
        console.error("Error in uninstalling application:", error);
        sendResponse(response, 500, "text/html", error.toString());
    }
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
    const objectId = decodeURIComponent(request.params.objectId);
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

        const webSkelConfig = require("../apihub-root/wallet/assistOS-configs.json");
        const application = webSkelConfig.applications.find(app => app.id == applicationId);

        const folderPath = `../apihub-root/spaces/${spaceId}/applications/${application.name}`;
        const manifestPath = `${folderPath}/manifest.json`;

        const manifest = await fsPromises.readFile(manifestPath, 'utf8');
        sendResponse(response, 200, "application/json", manifest);
    } catch (error) {
        console.error('Error reading manifest:', error);
        sendResponse(response, 500, "text/plain", "Internal Server Error");
    }
}
async function loadObjects(request, response){
    let filePath = `../apihub-root/spaces/${request.params.spaceId}/applications/${request.params.appName}/${request.params.objectType}`;
    try{
        await fsPromises.access(filePath);
    }catch (e) {
        try {
            await fsPromises.mkdir(filePath, { recursive: true });
        } catch(error) {
            return sendResponse(response, 500, "text/html", error+ ` Error at creating folder: ${filePath}`);
        }
    }
    let localData = [];
    try {
        const files = await fsPromises.readdir(filePath);
        const statPromises = files.map(async (file) => {
            const fullPath = path.join(filePath, file);
            const stat = await fsPromises.stat(fullPath);
            if (file.toLowerCase() !== ".git" && !file.toLowerCase().includes("license")) {
                return { file, stat };
            }
        });

        let fileStats = await Promise.all(statPromises);

        fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
        for (const { file } of fileStats) {
            const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
            localData.push(JSON.parse(jsonContent));
        }
    }catch (e) {
        sendResponse(response, 500, "text/plain", JSON.stringify(e));
    }

    sendResponse(response, 200, "application/json", JSON.stringify(localData));
}
async function loadApplicationComponents(request, response) {
    try {
        const {spaceId, applicationName, } = request.params;
        const baseUrl = `/app/${spaceId}/applications/${applicationName}/file`;
        const componentPath = request.url.substring(baseUrl.length);

        const filePath = `../apihub-root/spaces/${spaceId}/applications/${applicationName}/${componentPath}`;
        console.log("File Path:", filePath);

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
    storeObject,
    loadApplicationConfig,
    loadApplicationComponents,
    loadObjects,
}