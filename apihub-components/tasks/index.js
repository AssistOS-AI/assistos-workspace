const {
    cancelTask,
    getTasks,
    runTask,
    getDocumentTasks,
    compileVideoFromDocument,
    textToSpeechParagraph
} = require("./controller");
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function Tasks(server){
    server.use("/tasks/*", authentication);
    server.delete("/tasks/:spaceId/:taskId", cancelTask);
    server.get("/tasks/:spaceId", getTasks);
    server.get("/tasks/:spaceId/:documentId", getDocumentTasks);
    server.use("/tasks/*", bodyReader);
    server.post("/tasks/:taskId", runTask);

    server.post("/tasks/video/:spaceId/:documentId", compileVideoFromDocument);
    server.post("/tasks/audio/:spaceId/:documentId/:paragraphId", textToSpeechParagraph);
}
module.exports = Tasks;