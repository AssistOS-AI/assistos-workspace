const {
    cancelTask,
    getTasks,
    runTask,
    getDocumentTasks,
    compileVideoFromDocument,
    textToSpeechParagraph,
    lipSyncParagraph,
    cancelTaskAndRemove,
    getTask,
    getTaskRelevantInfo,
    runAllDocumentTasks,
    cancelAllDocumentTasks,
    compileVideoFromParagraph
} = require("./controller");
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function Tasks(server){
    server.use("/tasks/*", authentication);
    server.delete("/tasks/cancel/:taskId", cancelTask);
    server.delete("/tasks/remove/:taskId", cancelTaskAndRemove);

    server.get("/tasks/space/:spaceId", getTasks);
    server.get("/tasks/:taskId", getTask);
    server.get("/tasks/info/:taskId", getTaskRelevantInfo);
    server.use("/tasks/*", bodyReader);
    server.post("/tasks/:taskId", runTask);

    server.delete("/tasks/cancel-all/:spaceId/:documentId", cancelAllDocumentTasks);
    server.post("/tasks/run-all/:spaceId/:documentId", runAllDocumentTasks);

    server.get("/tasks/:spaceId/:documentId", getDocumentTasks);
    server.post("/tasks/video/:spaceId/:documentId", compileVideoFromDocument);
    server.post("/tasks/video/:spaceId/:documentId/:paragraphId", compileVideoFromParagraph);
    server.post("/tasks/audio/:spaceId/:documentId/:paragraphId", textToSpeechParagraph);
    server.post("/tasks/lipsync/:spaceId/:documentId/:paragraphId", lipSyncParagraph);
}
module.exports = Tasks;
