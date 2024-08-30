const TaskManager = require("./TaskManager");
const {sendResponse} = require("../apihub-component-utils/utils");
const DocumentToVideo = require("./DocumentToVideo");
const utils = require("../apihub-component-utils/utils");
const TextToSpeech = require("./TextToSpeech");
async function compileVideoFromDocument(request, response) {
    let documentId = request.params.documentId;
    let spaceId = request.params.spaceId;
    let userId = request.userId;
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    let task = new DocumentToVideo(securityContext, spaceId, userId, {spaceId, documentId});
    await TaskManager.addTask(task);
    sendResponse(response, 200, "application/json", {
        success: true,
        message: "Task added to the queue",
        data: task.id
    });
    TaskManager.runTask(task.id);
}
async function textToSpeechParagraph(request,response){
    try{
        const spaceId = request.params.spaceId;
        const documentId = request.params.documentId;
        const userId = request.userId;
        const paragraphId = request.params.paragraphId;
        const SecurityContext = require("assistos").ServerSideSecurityContext;
        const ttsCommand = request.body.command;
        const prompt = request.body.text;
        let securityContext = new SecurityContext(request);
        let task = new TextToSpeech(securityContext, spaceId, userId, {documentId, paragraphId, ttsCommand, prompt});
        await TaskManager.addTask(task);
        let documentModule = require("assistos").loadModule("document", securityContext);
        let paragraphConfig = await documentModule.getParagraphConfig(spaceId, documentId, paragraphId);
        paragraphConfig.commands["speech"].taskId = task.id;
        await documentModule.updateParagraphConfig(spaceId, documentId, paragraphId, paragraphConfig);
        utils.sendResponse(response,200,"application/json",{
            success:true,
            data: task.id,
            message:"Task added to the queue"
        });
    }catch(error){
        utils.sendResponse(response, error.statusCode||500, "application/json", {
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
    let spaceId = request.params.spaceId;
    let documentId = request.params.documentId;
    try {
        let tasks = TaskManager.serializeTasks(spaceId).filter(task => task.configs.documentId === documentId);
        tasks.forEach(task => TaskManager.runTask(task.id));
        sendResponse(response, 200, "application/json", {
            success: true,
            message: "Tasks added to queue"
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
    runAllDocumentTasks
}