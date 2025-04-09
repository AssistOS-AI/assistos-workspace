const path = require("path");
const fsPromises = require("fs").promises;
const {paths: dataVolumePaths} = require("../../volumeManager");
const {sendResponse, sendFileToClient} = require("../../apihub-component-utils/utils");
const git = require("../../apihub-component-utils/git.js");

async function ApplicationPlugin() {
    let self = {};
    let SpaceInstancePlugin = await $$.loadPlugin("SpaceInstancePlugin");
    let persistence = await $$.loadPlugin("SpaceInstancePersistence");
    self.getApplicationPath = function (applicationName) {
        return path.join(process.env.PERSISTENCE_FOLDER, "../", `applications/${applicationName}`);
    }

    self.getApplicationManifestPath = function (applicationName) {
        return path.join(self.getApplicationPath(applicationName), "manifest.json");
    }

    self.getApplicationTaskPath = function (applicationName, taskName) {
        return path.join(self.getApplicationPath(applicationName), "tasks", `${taskName}.js`);
    }

    self.getAvailableApps = function () {
        return require("../applications.json");
    }

    self.updateApplication = async function (applicationId) {
        const applicationMetadata = self.getAvailableApps().find(app => app.id === applicationId);
        if (!applicationMetadata) {
            throw new Error("Application not Found");
        }
        const applicationPath = self.getApplicationPath(applicationId);
        const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, applicationMetadata.repository, spaceId);
        if (applicationNeedsUpdate) {
            await git.updateRepo(applicationPath);
        } else {
            throw new Error("No updates available");
        }
    }

    self.requiresUpdate = async function (applicationId) {
        const applicationMetadata = self.getAvailableApps().find(app => app.id === applicationId);
        if (!applicationMetadata) {
            throw new Error("Application not Found");
        }
        const applicationPath = self.getApplicationPath(applicationId);
        return await git.checkForUpdates(applicationPath, applicationMetadata.repository, spaceId);
    }


    self.installApplication = async function (name) {
        const applications = self.getAvailableApps();
        const application = applications.find(app => app.name === name);
        if (!application) {
            throw new Error("Application not Found");
        }
        const applicationFolderPath = self.getApplicationPath(application.name);

        try {
            await git.clone(application.repository, applicationFolderPath);
        } catch (error) {
            if (error.message.includes("already exists and is not an empty directory")) {
                try {
                    await fsPromises.rm(applicationFolderPath, {recursive: true, force: true});
                } catch (e) {
                    //multiple users
                }
            }
            throw new Error("Failed to clone application repository " + error.message);
        }
        const manifestPath = self.getApplicationManifestPath(application.name);
        let manifestContent, manifest;
        try {
            manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
            manifest = JSON.parse(manifestContent);
        } catch (error) {
            throw new Error("Failed to read or parse Application manifest", error);
        }
        application.lastUpdate = await git.getLastCommitDate(applicationFolderPath);
        await git.installDependencies(manifest.dependencies);

        const copyFolder = async (src, dest) => {
            const entries = await fsPromises.readdir(src, { withFileTypes: true })
            await fsPromises.mkdir(dest, { recursive: true })

            for (const entry of entries) {
                const srcPath = path.join(src, entry.name)
                const destPath = path.join(dest, entry.name)

                if (entry.isDirectory()) {
                    await copyFolder(srcPath, destPath)
                } else {
                    await fsPromises.copyFile(srcPath, destPath)
                }
            }
        }

        try {
            const binariesPath=path.join(applicationFolderPath, 'binaries')
            const binariesDest = path.join(applicationFolderPath, '..','..', 'binaries')
            await copyFolder(binariesPath, binariesDest)
        } catch (_) {
            // binaries folder does not exist, ignore
        }

        await persistence.createApplication({
            name: application.name,
            lastUpdate: application.lastUpdate,
        })
    }
    self.getApplications = async function () {
        return await persistence.getEveryApplicationObject();
    }

    self.uninstallApplication = async function (applicationId) {
        const applications = self.getAvailableApps();
        const application = applications.find(app => app.id === applicationId);
        const manifestPath = self.getApplicationManifestPath(application.name);
        let manifestContent = JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));
        await git.uninstallDependencies(manifestContent.dependencies);
        await fsPromises.rm(self.getApplicationPath(applicationId), {recursive: true, force: true});
        await persistence.deleteApplication(applicationId);
    }

    self.loadApplicationConfig = async function (applicationId) {
        const applications = self.getAvailableApps();
        const application = applications.find(app => app.id === applicationId);
        if (!application) {
            throw new Error("Application not Found");

        }
        const manifestPath = self.getApplicationManifestPath(application.name);
        const manifest = await fsPromises.readFile(manifestPath, 'utf8');
        return JSON.parse(manifest);
    }

    self.runApplicationTask = async function (request, applicationId, taskName, taskData) {
        const ensureAllFunctionsExist = (taskFunctions) => {
            if (!taskFunctions.runTask) {
                throw new Error('runTask method must be implemented');
            }
            if (!taskFunctions.cancelTask) {
                throw new Error('cancelTask method must be implemented');
            }
        }
        const bindTaskFunctions = (ITaskInstance, taskFunctions) => {
            Object.entries(taskFunctions).forEach(([key, value]) => {
                ITaskInstance[key] = value.bind(ITaskInstance);
            })
        }
        const bindTaskParameters = (ITaskInstance, taskData) => {
            ITaskInstance.parameters = taskData;
        }

        const ITaskInstance = new ITask(request.userId, taskData);
        ITaskInstance.applicationId = applicationId;
        const taskPath = self.getApplicationTaskPath(applicationId, taskName);
        const taskFunctions = require(taskPath);
        ensureAllFunctionsExist(taskFunctions);
        bindTaskFunctions(ITaskInstance, taskFunctions);
        bindTaskParameters(ITaskInstance, taskData);
        await TaskManager.addTask(ITaskInstance);
        TaskManager.runTask(ITaskInstance.id);
        return ITaskInstance.id;
    }

    self.getApplicationsPlugins = async function (spaceId) {
        let applications = await persistence.getEveryApplicationObject();
        let plugins = {};
        for (let app of applications) {
            let manifest = await self.loadApplicationConfig(spaceId, app.name);
            if (!manifest.plugins) {
                continue;
            }
            for (let pluginType of Object.keys(manifest.plugins)) {
                if (!plugins[pluginType]) {
                    plugins[pluginType] = [];
                }
                for (let plugin of manifest.plugins[pluginType]) {
                    plugin.applicationId = app.name;
                }
                plugins[pluginType] = plugins[pluginType].concat(manifest.plugins[pluginType]);
            }
        }
        return plugins;
    }

    self.getApplicationWidget = async function (applicationName) {
        const applicationConfig = await self.loadApplicationConfig(applicationName);
        if (applicationConfig.components) {
            const widgets = applicationConfig.components.filter(component => component.type === "widget");
            return widgets;
        }
        return [];
    }

    self.getAssistOsWidgets = async function () {
        const webSkelConfig = require('../../../apihub-root/wallet/webskel-configs.json');
        const widgets = webSkelConfig.components.filter(component => component.type === "widget");
        return widgets;
    }

    self.getWidgets = async function () {
        const installedSpaceApplications = await SpaceInstancePlugin.getSpaceApplications();
        const widgets = {}
        for (const application of installedSpaceApplications) {
            const applicationWidgets = await self.getApplicationWidget(application.name);
            if (applicationWidgets.length > 0) {
                widgets[application.name] = applicationWidgets;
            }
        }
        const assistOsWidgets = await self.getAssistOsWidgets();
        if(assistOsWidgets.length > 0) {
            widgets['assistOS'] = assistOsWidgets;
        }
        return widgets;
    }
    self.saveJSON = async function (response, spaceData, filePath) {
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

    self.storeObject = async function (request, response) {
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
        if (await self.saveJSON(response, JSON.stringify(jsonData), filePath)) {
            sendResponse(response, 200, "application/json", {
                message: `Success, write ${objectId}`,
            });
        }
    }

    self.loadObjects = async function (request, response) {
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

    self.loadApplicationFile = async function(request, response) {
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
    return self;
}

let singletonInstance;
module.exports = {
    getInstance: async function () {
        if(!singletonInstance){
            singletonInstance = await ApplicationPlugin();
        }
        return singletonInstance;
    },
    getAllow: function(){
        return async function(id, name, command, ...args){
            return true;
        }
    },
    getDependencies: function(){
        return ["SpaceInstancePlugin", "SpaceInstancePersistence"];
    }
}

