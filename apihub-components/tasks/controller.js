const TaskManager = require("./TaskManager");
const {sendResponse} = require("../apihub-component-utils/utils");
const DocumentToVideo = require("./DocumentToVideo");
const utils = require("../apihub-component-utils/utils");
const TextToSpeech = require("./TextToSpeech");
const LipSync = require("./LipSync");
const subscriptionManager = require("../subscribers/SubscriptionManager");
async function compileVideoFromDocument(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    let sessionId = request.sessionId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    let task = new DocumentToVideo(securityContext, spaceId, userId, {spaceId, documentId});
    await TaskManager.addTask(task);
    subscriptionManager.notifyClients(sessionId, documentId + "/tasks");
    sendResponse(response, 200, "application/json", {
        success: true,
        message: "Task added to the queue",
        data: task.id
    });
    TaskManager.runTask(task.id);
}

async function textToSpeechParagraph(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const userId = request.userId;
        const sessionId = request.sessionId;

        const documentId = request.params.documentId;
        const paragraphId = request.params.paragraphId;

        const task = new TextToSpeech(spaceId, userId, {
            documentId,
            paragraphId,
        });
        await TaskManager.addTask(task);
        subscriptionManager.notifyClients(sessionId, documentId + "/tasks");
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: task.id,
            message: "Task added to the queue"
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function lipSyncParagraph(request, response) {
    try {
        const spaceId = request.params.spaceId;
        const userId = request.userId;

        const documentId = request.params.documentId;
        const paragraphId = request.params.paragraphId;
        let task = new LipSync(spaceId, userId, {documentId, paragraphId});
        await TaskManager.addTask(task);
        subscriptionManager.notifyClients(request.sessionId, documentId + "/tasks");
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: task.id,
            message: "Task added to the queue"
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error
        });
    }
}

async function cancelTaskAndRemove(request, response) {
    let taskId = request.params.taskId;
    try {
        await TaskManager.cancelTaskAndRemove(taskId);
        sendResponse(response, 200, "application/json", {
            success: true,
            message: `Task ${taskId} removed`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function removeTask(request, response) {
    let taskId = request.params.taskId;
    try {
        await TaskManager.removeTask(taskId);
        sendResponse(response, 200, "application/json", {
            success: true,
            message: `Task ${taskId} removed`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

function cancelTask(request, response) {
    let taskId = request.params.taskId;
    try {
        TaskManager.cancelTask(taskId);
        sendResponse(response, 200, "application/json", {
            success: true,
            message: `Task ${taskId} cancelled`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

function getTasks(request, response) {
    let spaceId = request.params.spaceId;
    try {
        let tasks = TaskManager.serializeTasks(spaceId);
        sendResponse(response, 200, "application/json", {
            success: true,
            data: tasks
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
async function getTaskRelevantInfo(request, response) {
    let taskId = request.params.taskId;
    try {
        let task = TaskManager.getTask(taskId);
        let taskInfo;
        if(typeof task.getRelevantInfo !== "function"){
            taskInfo = task.serialize();
        } else {
            taskInfo = await task.getRelevantInfo();
        }
        sendResponse(response, 200, "application/json", {
            success: true,
            data: taskInfo
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
function runTask(request, response) {
    let taskId = request.params.taskId;
    try {
        TaskManager.runTask(taskId);
        sendResponse(response, 200, "application/json", {
            success: true,
            message: `Task ${taskId} added`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

function getDocumentTasks(request, response) {
    let spaceId = request.params.spaceId;
    let documentId = request.params.documentId;
    try {
        let tasks = TaskManager.serializeTasks(spaceId).filter(task => task.configs.documentId === documentId);
        sendResponse(response, 200, "application/json", {
            success: true,
            data: tasks
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}

function getTask(request, response) {
    let taskId = request.params.taskId;
    try {
        let task = TaskManager.getTask(taskId);
        sendResponse(response, 200, "application/json", {
            success: true,
            data: task.serialize()
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
function runAllDocumentTasks(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    let throttler = require("./ConcurrentThrottler");
    try {
        let tasks = TaskManager.serializeTasks(spaceId).filter(task => task.configs.documentId === documentId);
        for (let task of tasks) {
            if(task.status === "created" || task.status === "cancelled" || task.status === "failed"){
                if(task.name === "LipSync"){
                    throttler.runTask(task.id);
                } else {
                    TaskManager.runTask(task.id);
                }
            }
        }
        return sendResponse(response, 200, "application/json", {
            success: true,
            message: "All tasks added to the queue"
        });
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
function cancelAllDocumentTasks(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    try {
        let tasks = TaskManager.serializeTasks(spaceId).filter(task => task.configs.documentId === documentId);
        for (let task of tasks) {
            if(task.status === "running"){
                TaskManager.cancelTask(task.id);
            }
        }
        sendResponse(response, 200, "application/json", {
            success: true,
            message: "All tasks cancelled"
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }
}
module.exports = {
    cancelTask,
    cancelTaskAndRemove,
    getTasks,
    runTask,
    getDocumentTasks,
    compileVideoFromDocument,
    textToSpeechParagraph,
    getTask,
    removeTask,
    lipSyncParagraph,
    getTaskRelevantInfo,
    runAllDocumentTasks,
    cancelAllDocumentTasks
}
