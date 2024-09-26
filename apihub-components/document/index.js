const documentHandler = require("./controllers/document.js");
const chapterHandler = require("./controllers/chapter.js");
const paragraphHandler = require("./controllers/paragraph.js");
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')
function document(server) {
    server.use("/documents/*", bodyReader);
    server.use("/documents/*", authentication);
    // Document
    server.get("/documents/:spaceId/:documentId", documentHandler.getDocument);
    server.post("/documents/:spaceId", documentHandler.createDocument);
    server.put("/documents/:spaceId/:documentId", documentHandler.updateDocument);
    server.delete("/documents/:spaceId/:documentId", documentHandler.deleteDocument);
    //Export & Import
    server.post("/documents/export/:spaceId/:documentId", documentHandler.exportDocument);
    server.post("/documents/import/:spaceId", documentHandler.importDocument);
    //Video
    server.get("/documents/video/estimate/:spaceId/:documentId", documentHandler.estimateDocumentVideoLength);
    //Chapter
    server.get("/documents/chapters/:spaceId/:documentId/:chapterId", chapterHandler.getChapter);
    server.post("/documents/chapters/:spaceId/:documentId", chapterHandler.createChapter);
    server.put("/documents/chapters/:spaceId/:documentId/:chapterId", chapterHandler.updateChapter);
    server.delete("/documents/chapters/:spaceId/:documentId/:chapterId", chapterHandler.deleteChapter);

    //Paragraph
    server.get("/documents/chapters/paragraphs/:spaceId/:documentId/:paragraphId", paragraphHandler.getParagraph);
    server.post("/documents/chapters/paragraphs/:spaceId/:documentId/:chapterId", paragraphHandler.createParagraph);
    server.put("/documents/chapters/paragraphs/:spaceId/:documentId/:paragraphId", paragraphHandler.updateParagraph);
    server.delete("/documents/chapters/paragraphs/:spaceId/:documentId/:chapterId/:paragraphId", paragraphHandler.deleteParagraph);
}

module.exports = document;
