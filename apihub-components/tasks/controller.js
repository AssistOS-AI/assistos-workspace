const TaskManager = require("./TaskManager");
const {sendResponse, sendFileToClient} = require("../apihub-component-utils/utils");
const DocumentToVideo = require("./DocumentToVideo");
const ChapterToVideo = require("./ChapterToVideo");
const utils = require("../apihub-component-utils/utils");
const TranslateDocument = require("./TranslateDocument");
const TextToSpeech = require("./TextToSpeech");
const LipSync = require("./LipSync");
const SubscriptionManager = require("../subscribers/SubscriptionManager");
const ParagraphToVideo = require("./ParagraphToVideo");
const fs = require('fs');
const throttler = require("./ConcurrentThrottler");

async function translateDocument(request, response){
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    let sessionId = request.sessionId;
    try {
        let language = request.body.language;
        let personalityId = request.body.personalityId;
        let task = new TranslateDocument(spaceId, userId, {documentId, language, personalityId});
        await TaskManager.addTask(task);
        notifyTasksListUpdate(sessionId, spaceId);
        sendResponse(response, 200, "application/json", {
            data: task.id
        });
        TaskManager.runTask(task.id);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}
async function compileVideoFromDocument(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    let sessionId = request.sessionId;
    try {
        let task = new DocumentToVideo(spaceId, userId, {documentId});
        await TaskManager.addTask(task);
        notifyTasksListUpdate(sessionId, spaceId);
        sendResponse(response, 200, "application/json", {
            data: task.id
        });
        setTimeout(() => {
            TaskManager.runTask(task.id);
        }, 1000);
        //TaskManager.runTask(task.id);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function compileVideoFromChapter(request, response) {
    let documentId = request.params.documentId;
    let chapterId = request.params.chapterId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    let sessionId = request.sessionId;
    try {
        let task = new ChapterToVideo(spaceId, userId, {documentId, chapterId});
        await TaskManager.addTask(task);
        notifyTasksListUpdate(sessionId, spaceId);
        sendResponse(response, 200, "application/json", {
            data: task.id
        });
        setTimeout(() => {
            TaskManager.runTask(task.id);
        }, 1000);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function compileVideoFromParagraph(request, response) {
    let documentId = request.params.documentId;
    let paragraphId = request.params.paragraphId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    let sessionId = request.sessionId;
    try {
        let task = new ParagraphToVideo(spaceId, userId, {documentId, paragraphId});
        await TaskManager.addTask(task);
        notifyTasksListUpdate(sessionId, spaceId);
        sendResponse(response, 200, "application/json", {
            data: task.id
        });
        TaskManager.runTask(task.id);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

function notifyTasksListUpdate(sessionId, spaceId) {
    let objectId = SubscriptionManager.getObjectId(spaceId, "tasks");
    SubscriptionManager.notifyClients(sessionId, objectId);
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
        notifyTasksListUpdate(sessionId, spaceId);
        utils.sendResponse(response, 200, "application/json", {
            data: task.id,
            message: "Task added to the queue"
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
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
        notifyTasksListUpdate(request.sessionId, documentId);
        utils.sendResponse(response, 200, "application/json", {
            data: task.id,
            message: "Task added to the queue"
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error
        });
    }
}

async function cancelTaskAndRemove(request, response) {
    let taskId = request.params.taskId;
    try {
        await TaskManager.cancelTaskAndRemove(taskId);
        sendResponse(response, 200, "application/json", {
            message: `Task ${taskId} removed`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function removeTask(request, response) {
    let taskId = request.params.taskId;
    try {
        await TaskManager.removeTask(taskId);
        sendResponse(response, 200, "application/json", {
            message: `Task ${taskId} removed`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

function cancelTask(request, response) {
    let taskId = request.params.taskId;
    try {
        TaskManager.cancelTask(taskId);
        sendResponse(response, 200, "application/json", {
            message: `Task ${taskId} cancelled`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

function getTasks(request, response) {
    let spaceId = request.params.spaceId;
    try {
        let tasks = TaskManager.serializeTasks(spaceId);
        sendResponse(response, 200, "application/json", {
            data: tasks
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}


async function getTaskRelevantInfo(request, response) {
    let taskId = request.params.taskId;
    try {
        let task = TaskManager.getTask(taskId);
        let taskInfo;
        if (typeof task.getRelevantInfo !== "function") {
            taskInfo = task.serialize();
        } else {
            taskInfo = await task.getRelevantInfo();
        }
        sendResponse(response, 200, "application/json", {
            data: taskInfo
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

function runTask(request, response) {
    let taskId = request.params.taskId;
    try {
        TaskManager.runTask(taskId);
        sendResponse(response, 200, "application/json", {
            message: `Task ${taskId} added`
        });
    } catch (error) {
        sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

function getDocumentTasks(request, response) {
    let spaceId = request.params.spaceId;
    let documentId = request.params.documentId;
    try {
        let tasks = TaskManager.serializeTasks(spaceId).filter((task) => {
            if(!task.configs){
                return false;
            }
            return task.configs.documentId === documentId
        });
        sendResponse(response, 200, "application/json", {
            data: tasks
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}

async function getTask(request, response) {
    let taskId = request.params.taskId;
    try {
        let task = TaskManager.getTask(taskId);
        sendResponse(response, 200, "application/json", {
            data: task.serialize()
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }
}


async function downloadTaskLogs(request, response) {
    const spaceId = request.params.spaceId;
    try {
        const filePath = await TaskManager.getTaskLogFilePath(spaceId);
        const logFile = fs.readFileSync(filePath);
        const fileName= filePath.split('/').pop();
        response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Content-Disposition': `attachment; filename="${fileName}"`
        });
        response.end(logFile);
    } catch (e) {
        response.writeHead(e.statusCode || 500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ message: e.message }));
    }
}




async function runAllDocumentTasks(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    // try{
    //     let SecurityContext = require("assistos").ServerSideSecurityContext;
    //     let securityContext = new SecurityContext(request);
    //     let documentModule = require("assistos").loadModule("document", securityContext);
    //     let document = await documentModule.getDocument(spaceId, documentId);
    //
    //     let throttler = require("./ConcurrentThrottler");
    //     let tasks = [];
    //     for(let chapter of document.chapters){
    //         for(let paragraph of chapter.paragraphs){
    //             if(paragraph.commands.speech){
    //                 let task = new TextToSpeech(spaceId, securityContext.userId, {
    //                     documentId,
    //                     paragraphId: paragraph.id
    //                 });
    //                 await TaskManager.addTask(task);
    //                 paragraph.commands.speech.taskId = task.id;
    //                 await documentModule.updateParagraphCommands(spaceId, documentId, paragraph.id, paragraph.commands);
    //                 let objectId = SubscriptionManager.getObjectId(spaceId, "tasks");
    //                 SubscriptionManager.notifyClients("", objectId, {taskId: task.id});
    //                 tasks.push({taskId:task.id, type:"speech"});
    //             }
    //             if(paragraph.commands.lipSync){
    //                 let task = new LipSync(spaceId, securityContext.userId, {
    //                     documentId,
    //                     paragraphId: paragraph.id
    //                 });
    //                 await TaskManager.addTask(task);
    //                 paragraph.commands.lipSync.taskId = task.id;
    //                 await documentModule.updateParagraphCommands(spaceId, documentId, paragraph.id, paragraph.commands);
    //                 tasks.push({taskId:task.id, type:"lipsync"});
    //             }
    //         }
    //     }
    //     sendResponse(response, 200, "application/json", {});
    //     for(let task of tasks){
    //         if(task.type === "lipsync"){
    //             throttler.runTask(task.taskId);
    //         } else {
    //             TaskManager.runTask(task.taskId);
    //         }
    //     }
    // }catch (e) {
    //     return sendResponse(response, 500, "application/json", {
    //         message: e.message
    //     });
    // }
    try {
        let tasks = TaskManager.serializeTasks(spaceId).filter(task => task.configs.documentId === documentId);
        for (let task of tasks) {
            if (task.status === "created") {
                if (task.name === "LipSync") {
                    throttler.runTask(task.id);
                } else {
                    TaskManager.runTask(task.id);
                }
            }
        }
        return sendResponse(response, 200, "application/json", {
            message: "All tasks added to the queue"
        });
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
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
            if (task.status === "running") {
                TaskManager.cancelTask(task.id);
            }
        }
        sendResponse(response, 200, "application/json", {
            message: "All tasks cancelled"
        });
    } catch (e) {
        sendResponse(response, 500, "application/json", {
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
    cancelAllDocumentTasks,
    downloadTaskLogs,
    compileVideoFromParagraph,
    compileVideoFromChapter,
    translateDocument
}
