function Documents(server) {
    const { getDocumentPage, getDocumentTitlePage, getDocumentAbstractPage } = require("./controller");

    server.get("/documents/:documentId", getDocumentPage);
    server.get("/documents/:documentId/edit-title", getDocumentTitlePage);
    server.get("/documents/:documentId/edit-abstract", getDocumentAbstractPage);
}

module.exports = Documents;
