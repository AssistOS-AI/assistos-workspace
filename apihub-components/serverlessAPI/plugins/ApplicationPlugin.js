const path = require("path");
const fsPromises = require("fs").promises;

const CustomError = require("../../apihub-component-utils/CustomError.js");
const {paths: dataVolumePaths} = require("../../volumeManager");
const git = require("../../apihub-component-utils/git.js");
const TaskManager = require("../../tasks/TaskManager");
const ITask = require("../../tasks/Task");
const FlowTask = require("../../tasks/FlowTask");
async function ApplicationPlugin() {
    let self = {};
    let persistence = await $$.loadPlugin("SpacePersistence");
    let SpacePlugin = await $$.loadPlugin("SpacePlugin");
    self.getApplicationPath = function (spaceId, applicationName) {
        return path.join(dataVolumePaths.space, `${spaceId}/applications/${applicationName}`);
    }

    self.getApplicationManifestPath = function (spaceId, applicationName) {
        return path.join(self.getApplicationPath(spaceId, applicationName), "manifest.json");
    }

    self.getApplicationFlowsPath = function (spaceId, applicationName) {
        return path.join(self.getApplicationPath(spaceId, applicationName), "flows");
    }

    self.getApplicationTasksPath = function (spaceId, applicationName) {
        return path.join(self.getApplicationPath(spaceId, applicationName), "tasks");
    }

    self.getApplicationTaskPath = function (spaceId, applicationName, taskName) {
        return path.join(self.getApplicationPath(spaceId, applicationName), "tasks", `${taskName}.js`);
    }

    self.loadApplicationsMetadata = function () {
        return require("../../applications-storage/applications.json");
    }

    self.updateApplication = async function (spaceId, applicationId) {
        const applicationMetadata = self.loadApplicationsMetadata().find(app => app.id === applicationId);
        if (!applicationMetadata) {
            CustomError.throwNotFoundError("Application not Found");
        }
        const applicationPath = self.getApplicationPath(spaceId, applicationId);
        const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, applicationMetadata.repository, spaceId);
        if (applicationNeedsUpdate) {
            await git.updateRepo(applicationPath);
        } else {
            CustomError.throwBadRequestError("No updates available");
        }
    }

    self.requiresUpdate = async function (spaceId, applicationId) {
        const applicationMetadata = self.loadApplicationsMetadata().find(app => app.id === applicationId);
        if (!applicationMetadata) {
            CustomError.throwNotFoundError("Application not Found");
        }
        const applicationPath = self.getApplicationPath(spaceId, applicationId);
        return await git.checkForUpdates(applicationPath, applicationMetadata.repository, spaceId);
    }


    self.installApplication = async function (spaceId, applicationId) {
        const applications = self.loadApplicationsMetadata();

        const application = applications.find(app => app.id === applicationId);
        if (!application) {
            CustomError.throwNotFoundError("Application not Found");
        }
        const applicationFolderPath = self.getApplicationPath(spaceId, application.name);

        try {
            await git.clone(application.repository, applicationFolderPath, spaceId);
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
        const manifestPath = self.getApplicationManifestPath(spaceId, application.name);
        let manifestContent, manifest;
        try {
            manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
            manifest = JSON.parse(manifestContent);
        } catch (error) {
            CustomError.throwServerError("Failed to read or parse Application manifest", error);
        }
        application.lastUpdate = await git.getLastCommitDate(applicationFolderPath);
        await git.installDependencies(manifest.dependencies);
        await SpacePlugin.addApplicationToSpaceObject(spaceId, application, manifest);
    }

    self.uninstallApplication = async function (spaceId, applicationId) {
        try {
            const applications = self.loadApplicationsMetadata();
            const application = applications.find(app => app.id === applicationId);
            const manifestPath = self.getApplicationManifestPath(spaceId, application.name);
            let manifestContent = JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));
            await git.uninstallDependencies(manifestContent.dependencies);
            await fsPromises.rm(self.getApplicationPath(spaceId, applicationId), {recursive: true, force: true});
        } catch (error) {
            throw new Error("Failed to uninstall application " + error.message);
        }
        await SpacePlugin.removeApplicationFromSpaceObject(spaceId, applicationId);
    }

    self.loadApplicationConfig = async function (spaceId, applicationId) {
        const applications = self.loadApplicationsMetadata();

        const application = applications.find(app => app.id === applicationId);
        if (!application) {
            CustomError.throwNotFoundError("Application not Found");

        }
        const manifestPath = self.getApplicationManifestPath(spaceId, application.name);
        const manifest = await fsPromises.readFile(manifestPath, 'utf8');
        return JSON.parse(manifest);
    }

    self.runApplicationTask = async function (request, spaceId, applicationId, taskName, taskData) {
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

        const ITaskInstance = new ITask(spaceId, request.userId, taskData);
        ITaskInstance.applicationId = applicationId;
        const taskPath = self.getApplicationTaskPath(spaceId, applicationId, taskName);
        const taskFunctions = require(taskPath);
        ensureAllFunctionsExist(taskFunctions);
        bindTaskFunctions(ITaskInstance, taskFunctions);
        bindTaskParameters(ITaskInstance, taskData);
        await TaskManager.addTask(ITaskInstance);
        TaskManager.runTask(ITaskInstance.id);
        return ITaskInstance.id;
    }

    self.runApplicationFlow = async function (request, spaceId, applicationId, flowId, flowData) {
        const SecurityContextClass = require('assistos').ServerSideSecurityContext;
        const flowInstance = await new FlowTask(new SecurityContextClass(request), spaceId, request.userId, applicationId, flowData, flowId);
        return await flowInstance.runTask();
    }

    self.getApplicationTasks = async function (spaceId, applicationId) {
        let tasks = TaskManager.serializeTasks(spaceId);
        return tasks.filter(task => task.applicationId === applicationId);
    }

    self.getApplicationsPlugins = async function (spaceId) {
        const spaceStatusObject = await SpacePlugin.getSpaceStatusObject(spaceId);
        const applications = spaceStatusObject.installedApplications;
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

    self.getApplicationWidget = async function (spaceId, applicationName) {
        const applicationConfig = await self.loadApplicationConfig(spaceId, applicationName);
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

    self.getWidgets = async function (spaceId) {
        const installedSpaceApplications = await SpacePlugin.getSpaceApplications(spaceId);
        const widgets = {}
        for (const application of installedSpaceApplications) {
            const applicationWidgets = await self.getApplicationWidget(spaceId, application.name);
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
        return ["SpacePersistence", "SpacePlugin"];
    }
}

