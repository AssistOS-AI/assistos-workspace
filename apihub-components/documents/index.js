function Documents(server) {
    const { getDocumentPage, getDocumentTitlePage, getDocumentAbstractPage, getDocumentSettingsPage } = require("./controller");

    server.get("/documents/:documentId", getDocumentPage);
    server.get("/documents/:documentId/edit-title", getDocumentTitlePage);
    server.get("/documents/:documentId/edit-abstract", getDocumentAbstractPage);
    server.get("/documents/:documentId/settings", getDocumentSettingsPage);
}

module.exports = Documents;
