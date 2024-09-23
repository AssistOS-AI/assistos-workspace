const documentHandler = require("./controllers/document.js");
const chapterHandler = require("./controllers/chapter.js");
const paragraphHandler = require("./controllers/paragraph.js");

function document(server) {
    // Document
    server.get("/spaces/:spaceId/documents/:documentId", documentHandler.getDocument);
    server.post("/spaces/:spaceId/documents", documentHandler.createDocument);
    server.put("/spaces/:spaceId/documents/:documentId", documentHandler.updateDocument);
    server.delete("/spaces/:spaceId/documents/:documentId", documentHandler.deleteDocument);
    //Export & Import
    server.get("/spaces/:spaceId/documents/:documentId/export", documentHandler.exportDocument);
    server.post("/spaces/:spaceId/documents/:documentId/import", documentHandler.importDocument);

    //Chapter
    server.get("/spaces/:spaceId/documents/:documentId/chapters/:chapterId", chapterHandler.getChapter);
    server.post("/spaces/:spaceId/documents/:documentId/chapters", chapterHandler.createChapter);
    server.put("/spaces/:spaceId/documents/:documentId/chapters/:chapterId", chapterHandler.updateChapter);
    server.delete("/spaces/:spaceId/documents/:documentId/chapters/:chapterId", chapterHandler.deleteChapter);

    //Paragraph
    server.get("/spaces/:spaceId/documents/:documentId/chapters/:chapterId/paragraphs/:paragraphId", paragraphHandler.getParagraph);
    server.post("/spaces/:spaceId/documents/:documentId/chapters/:chapterId/paragraphs", paragraphHandler.createParagraph);
    server.put("/spaces/:spaceId/documents/:documentId/chapters/:chapterId/paragraphs/:paragraphId", paragraphHandler.updateParagraph);
    server.delete("/spaces/:spaceId/documents/:documentId/chapters/:chapterId/paragraphs/:paragraphId", paragraphHandler.deleteParagraph);
}

module.exports = document;
