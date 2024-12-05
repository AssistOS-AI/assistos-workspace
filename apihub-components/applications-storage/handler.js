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


    const applicationNeedsUpdate = await git.checkForUpdates(applicationPath, applicationMetadata.repository);
    const flowsNeedsUpdate = await git.checkForUpdates(applicationFlowsPath, applicationMetadata.flowsRepository);

    if (!applicationNeedsUpdate && !flowsNeedsUpdate) {
        CustomError.throwBadRequestError("No updates available");
    }

    if (applicationNeedsUpdate) {
        await git.updateRepo(applicationPath);
    }
    if (flowsNeedsUpdate) {
        await git.updateRepo(applicationFlowsPath);
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
    const flowsNeedsUpdate = applicationMetadata.flowsRepository
        ? await git.checkForUpdates(applicationFlowsPath, applicationMetadata.flowsRepository)
        : false;
    const tasksNeedsUpdate = applicationMetadata.tasksRepository
        ? await git.checkForUpdates(applicationTasksPath, applicationMetadata.tasksRepository)
        : false;

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
    if (application.flowsRepository) {
        const flowsFolderPath = getApplicationFlowsPath(spaceId, application.name);
        try {
            await git.clone(application.flowsRepository, flowsFolderPath);
        } catch (error) {
            CustomError.throwServerError("Failed to clone Application flows repository", error);
        }
        try {
            await fsPromises.unlink(path.join(applicationFolderPath, "README.md"));
        } catch (error) {
            /* ignore */
        }
    }
    if (application.tasksRepository) {
        const tasksFolderPath = getApplicationTasksPath(spaceId, application.name);
        try {
            await git.clone(application.tasksRepository, tasksFolderPath);
        } catch (error) {
            CustomError.throwServerError("Failed to clone Application tasks repository", error);
        }
        try {
            await fsPromises.unlink(path.join(applicationFolderPath, "README.md"));
        } catch (error) {
            /* ignore */
        }
    }
    application.lastUpdate = await git.getLastCommitDate(applicationFolderPath);
    await Space.APIs.addApplicationToSpaceObject(spaceId, application, manifest);
}

async function uninstallApplication(spaceId, applicationId) {
    try {
        await fsPromises.rm(getApplicationPath(spaceId, applicationId), {recursive: true, force: true});
    } catch (error) {
        CustomError.throwServerError("Failed to remove Application folder", error);
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

module.exports = {
    installApplication,
    uninstallApplication,
    getApplicationsMetadata,
    loadApplicationConfig,
    runApplicationTask,
    runApplicationFlow,
    updateApplication,
    requiresUpdate
};

