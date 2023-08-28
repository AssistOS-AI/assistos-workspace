function Documents(server) {
    const { getDocumentPage, getDocumentTitlePage, getDocumentAbstractPage, getDocumentSettingsPage, getDocumentBrainstormingPage } = require("./controller");

    server.get("/documents/:documentId", getDocumentPage);
    server.get("/documents/:documentId/edit-title", getDocumentTitlePage);
    server.get("/documents/:documentId/edit-abstract", getDocumentAbstractPage);
    server.get("/documents/:documentId/settings", getDocumentSettingsPage);
    server.get("/documents/:documentId/brainstorming", getDocumentBrainstormingPage);
}

module.exports = Documents;
