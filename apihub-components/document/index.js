const documentHandler = require("./controllers/document.js");
const chapterHandler = require("./controllers/chapter.js");
const paragraphHandler = require("./controllers/paragraph.js");
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')
function document(server) {
    // Register the document conversion endpoint before applying bodyReader middleware
    // This endpoint needs to handle the raw request for multipart/form-data
    server.post("/documents/convert", (req, res) => {
        documentHandler.proxyDocumentConversion(req, res);
    });

    server.use("/documents/*", bodyReader);
    server.use("/documents/*", authentication);
    // Document
    server.get("/documents/metadata/:spaceId", documentHandler.getDocumentsMetadata);
    server.get("/documents/:spaceId/:documentId", documentHandler.getDocument);
    server.post("/documents/:spaceId", documentHandler.createDocument);
    server.put("/documents/:spaceId/:documentId", documentHandler.updateDocument);
    server.delete("/documents/:spaceId/:documentId", documentHandler.deleteDocument);

    //Undo & Redo
    server.put("/documents/undo/:spaceId/:documentId", documentHandler.undoOperation);
    server.put("/documents/redo/:spaceId/:documentId", documentHandler.redoOperation);

    //Snapshots
    server.get("/documents/snapshots/:spaceId/:documentId", documentHandler.getDocumentSnapshots);
    server.post("/documents/snapshots/:spaceId/:documentId", documentHandler.addDocumentSnapshot);
    server.put("/documents/snapshots/:spaceId/:documentId/:snapshotId", documentHandler.restoreDocumentSnapshot);
    server.delete("/documents/snapshots/:spaceId/:documentId/:snapshotId", documentHandler.deleteDocumentSnapshot);

    //Selections
    server.get("/documents/select/:spaceId/:documentId", documentHandler.getSelectedDocumentItems);
    server.put("/documents/select/:spaceId/:documentId/:itemId", documentHandler.selectDocumentItem);
    server.delete("/documents/select/:spaceId/:documentId/:itemId/:selectId", documentHandler.deselectDocumentItem);

    //Export & Import
    server.post("/documents/export/:spaceId/:documentId", documentHandler.exportDocument);
    server.get("/documents/export/:spaceId/:fileName", documentHandler.downloadDocumentArchive);
    server.post("/documents/import/:spaceId", documentHandler.importDocument);
    server.post("/documents/export/docx/:spaceId/:documentId", documentHandler.exportDocumentAsDocx);


    //Video
    server.get("/documents/video/:spaceId/:fileName", documentHandler.downloadDocumentVideo);
    server.get("/documents/video/estimate/:spaceId/:documentId", documentHandler.estimateDocumentVideoLength);

    //Chapter
    server.get("/documents/chapters/:spaceId/:documentId/:chapterId", chapterHandler.getChapter);
    server.post("/documents/chapters/:spaceId/:documentId", chapterHandler.createChapter);
    server.put("/documents/chapters/:spaceId/:documentId/:chapterId", chapterHandler.updateChapter);
    server.put("/documents/chapters/swap/:spaceId/:documentId/:chapterId1/:chapterId2", chapterHandler.swapChapters);
    server.delete("/documents/chapters/:spaceId/:documentId/:chapterId", chapterHandler.deleteChapter);

    //Paragraph
    server.get("/documents/chapters/paragraphs/:spaceId/:documentId/:paragraphId", paragraphHandler.getParagraph);
    server.post("/documents/chapters/paragraphs/:spaceId/:documentId/:chapterId", paragraphHandler.createParagraph);
    server.put("/documents/chapters/paragraphs/:spaceId/:documentId/:paragraphId", paragraphHandler.updateParagraph);
    server.put("/documents/chapters/paragraphs/swap/:spaceId/:documentId/:chapterId/:paragraphId1/:paragraphId2", paragraphHandler.swapParagraphs);
    server.delete("/documents/chapters/paragraphs/:spaceId/:documentId/:chapterId/:paragraphId", paragraphHandler.deleteParagraph);


}

module.exports = document;
