const path = require("path");
const fsPromises = require("fs").promises;

const CustomError = require("../apihub-component-utils/CustomError.js");
const {paths: dataVolumePaths} = require("../volumeManager");
const git = require("../apihub-component-utils/git.js");
const Space = require("../spaces-storage/space.js");
const TaskManager = require("../tasks/TaskManager");

function getApplicationPath(spaceId, applicationName) {
    return path.join(dataVolumePaths.space, `${spaceId}/applications/${applicationName}`);
}

function getApplicationManifestPath(spaceId, applicationName) {
    return path.join(getApplicationPath(spaceId, applicationName), "manifest.json");
}

function getApplicationFlowsPath(spaceId, applicationName) {
    return path.join(getApplicationPath(spaceId, applicationName), "flows");
}

function getApplicationTasksPath(spaceId, applicationName) {
    return path.join(getApplicationPath(spaceId, applicationName), "tasks");
}

function getApplicationTaskPath(spaceId, applicationName, taskName) {
    return path.join(getApplicationPath(spaceId, applicationName), "tasks", `${taskName}.js`);
}

function loadApplicationsMetadata() {
    return require("./applications.json");
}

async function updateApplication(spaceId, applicationId) {
    const applicationMetadata = loadApplicationsMetadata().find(app => app.id === applicationId);
    if (!applicationMetadata) {
        CustomError.throwNotFoundError("Application not Found");
    }

    const applicationPath = getApplicationPath(spaceId, applicationId);
    const applicationFlowsPath = getApplicationFlowsPath(spaceId, applicationId);
    const applicationTasksPath = getApplicationTasksPath(spaceId, applicationId);

    const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, applicationMetadata.repository);

    const flowsNeedsUpdate = applicationMetadata.flowsRepository ?
        await git.checkForUpdates(applicationFlowsPath, applicationMetadata.flowsRepository)
        : false;
    const tasksNeedsUpdate = applicationMetadata.tasksRepository ?
        await git.checkForUpdates(applicationTasksPath, applicationMetadata.tasksRepository)
        : false;

    if (!applicationNeedsUpdate && !flowsNeedsUpdate && !tasksNeedsUpdate) {
        CustomError.throwBadRequestError("No updates available");
    }

    if (applicationNeedsUpdate) {
        await git.updateRepo(applicationPath);
    }
    if (flowsNeedsUpdate) {
        await git.updateRepo(applicationFlowsPath);
    }
    if (tasksNeedsUpdate) {
        await git.updateRepo(applicationTasksPath);
    }
}

async function requiresUpdate(spaceId, applicationId) {
    const applicationMetadata = loadApplicationsMetadata().find(app => app.id === applicationId);
    if (!applicationMetadata) {
        CustomError.throwNotFoundError("Application not Found");
    }

    const applicationPath = getApplicationPath(spaceId, applicationId);
    const applicationFlowsPath = getApplicationFlowsPath(spaceId, applicationId);
    const applicationTasksPath = getApplicationTasksPath(spaceId, applicationId);

    const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, applicationMetadata.repository);

    let flowsNeedsUpdate = false;
    let tasksNeedsUpdate = false;

    try {
        await fsPromises.access(applicationFlowsPath);
        flowsNeedsUpdate = applicationMetadata.flowsRepository
            ? await git.checkForUpdates(applicationFlowsPath, applicationMetadata.flowsRepository)
            : false;
    } catch (error) {
        /* ignore */
    }
    try{
        await fsPromises.access(applicationTasksPath);
        tasksNeedsUpdate = applicationMetadata.tasksRepository
            ? await git.checkForUpdates(applicationTasksPath, applicationMetadata.tasksRepository)
            : false;
    }catch(error){
        /* ignore */
    }
    return applicationNeedsUpdate || flowsNeedsUpdate || tasksNeedsUpdate;
}


async function installApplication(spaceId, applicationId) {
    const applications = loadApplicationsMetadata();

    const application = applications.find(app => app.id === applicationId);
    if (!application) {
        CustomError.throwNotFoundError("Application not Found");
    }
    const applicationFolderPath = getApplicationPath(spaceId, application.name);

    try {
        await git.clone(application.repository, applicationFolderPath);
    } catch (error) {
        CustomError.throwServerError("Failed to clone Application repository", error);
    }
    const manifestPath = getApplicationManifestPath(spaceId, application.name);
    let manifestContent, manifest;
    try {
        manifestContent = await fsPromises.readFile(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
    } catch (error) {
        CustomError.throwServerError("Failed to read or parse Application manifest", error);
    }
    application.lastUpdate = await git.getLastCommitDate(applicationFolderPath);
    //await git.installDependencies(manifest.dependencies);
    await Space.APIs.addApplicationToSpaceObject(spaceId, application, manifest);
}

async function uninstallApplication(spaceId, applicationId) {
    try {
        const applications = loadApplicationsMetadata();
        const application = applications.find(app => app.id === applicationId);
        const manifestPath = getApplicationManifestPath(spaceId, application.name);
        let manifestContent = JSON.parse(await fsPromises.readFile(manifestPath, 'utf8'));
        //await git.uninstallDependencies(manifestContent.dependencies);
        await fsPromises.rm(getApplicationPath(spaceId, applicationId), {recursive: true, force: true});
    } catch (error) {
        CustomError.throwServerError("Failed to uninstall application", error);
    }
    await Space.APIs.removeApplicationFromSpaceObject(spaceId, applicationId);
}

async function getApplicationsMetadata() {
    return loadApplicationsMetadata();
}

async function loadApplicationConfig(spaceId, applicationId) {
    const applications = loadApplicationsMetadata();

    const application = applications.find(app => app.id === applicationId);
    if (!application) {
        CustomError.throwNotFoundError("Application not Found");

    }
    const manifestPath = getApplicationManifestPath(spaceId, application.name);
    const manifest = await fsPromises.readFile(manifestPath, 'utf8');
    return JSON.parse(manifest);
}

async function runApplicationTask(request, spaceId, applicationId, taskName, taskData) {
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

    const ITask = require('../tasks/Task.js')
    const ITaskInstance = new ITask(spaceId, request.userId, taskData);
    ITaskInstance.applicationId = applicationId;
    const taskPath = getApplicationTaskPath(spaceId, applicationId, taskName);
    const taskFunctions = require(taskPath);
    ensureAllFunctionsExist(taskFunctions);
    bindTaskFunctions(ITaskInstance, taskFunctions);
    bindTaskParameters(ITaskInstance, taskData);
    await TaskManager.addTask(ITaskInstance);
    TaskManager.runTask(ITaskInstance.id);
    return ITaskInstance.id;
}

async function runApplicationFlow(request, spaceId, applicationId, flowId, flowData) {
    const FlowTask = require("../tasks/FlowTask.js");
    const SecurityContextClass = require('assistos').ServerSideSecurityContext;
    const flowInstance = await new FlowTask(new SecurityContextClass(request), spaceId, request.userId, applicationId, flowData, flowId);
    return await flowInstance.runTask();
}
async function getApplicationTasks(spaceId, applicationId) {
    let tasks = TaskManager.serializeTasks(spaceId);
    return tasks.filter(task => task.applicationId === applicationId);
}
async function getApplicationsPlugins(spaceId) {
    const spaceStatusObject = await Space.APIs.getSpaceStatusObject(spaceId);
    const applications = spaceStatusObject.installedApplications;
    let plugins = {};
    for(let app of applications){
        let manifest = await loadApplicationConfig(spaceId, app.name);
        if(!manifest.plugins){
            continue;
        }
        for(let pluginType of Object.keys(manifest.plugins)){
            if(!plugins[pluginType]){
                plugins[pluginType] = [];
            }
            for(let plugin of manifest.plugins[pluginType]){
                plugin.applicationId = app.name;
            }
            plugins[pluginType] = plugins[pluginType].concat(manifest.plugins[pluginType]);
        }
    }
    return plugins;
}
module.exports = {
    installApplication,
    uninstallApplication,
    getApplicationsMetadata,
    loadApplicationConfig,
    runApplicationTask,
    runApplicationFlow,
    updateApplication,
    requiresUpdate,
    getApplicationTasks,
    getApplicationsPlugins
};

