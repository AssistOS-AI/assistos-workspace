function Documents(server) {
    const { getDocumentPage, getDocumentTitlePage } = require("./controller");

    server.get("/documents/:documentId", getDocumentPage);
    server.get("/documents/:documentId/edit-title", getDocumentTitlePage);
}

module.exports = Documents;
