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
        let securityContext = new SecurityContext(request);
        let task = new TextToSpeech(securityContext, spaceId, userId, {documentId, paragraphId});
        await TaskManager.addTask(task);
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
function cancelTask(request, response) {
    let taskId = request.params.taskId;
    try {
        TaskManager.cancelTaskAndRemove(taskId);
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
        let tasks = TaskManager.serializeTasks(spaceId).filter(task => task.documentId === documentId);
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
module.exports = {
    cancelTask,
    getTasks,
    runTask,
    getDocumentTasks,
    compileVideoFromDocument,
    textToSpeechParagraph
}