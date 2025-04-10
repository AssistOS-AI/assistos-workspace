const documentHandler = require("./controllers/document.js");
const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
function document(server) {
    // Register the document conversion endpoint before applying bodyReader middleware
    // This endpoint needs to handle the raw request for multipart/form-data
    server.post("/documents/convert", (req, res) => {
        documentHandler.proxyDocumentConversion(req, res);
    });

    server.use("/documents/*", bodyReader);

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
}

module.exports = document;
