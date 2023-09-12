function Documents(server) {
    const { getDocumentPage, getDocumentTitlePage, getDocumentAbstractPage, getDocumentSettingsPage, getDocumentBrainstormingPage, getChapterTitlePage, getChapterBrainstormingPage } = require("./controller");

    server.get("/documents/:documentId", getDocumentPage);
    server.get("/documents/:documentId/edit-title", getDocumentTitlePage);
    server.get("/documents/:documentId/edit-abstract", getDocumentAbstractPage);
    server.get("/documents/:documentId/settings", getDocumentSettingsPage);
    server.get("/documents/:documentId/brainstorming", getDocumentBrainstormingPage);
    server.get("/documents/:documentId/edit-chapter-title/:chapterId", getChapterTitlePage);
    server.get("/documents/:documentId/chapter-brainstorming/:chapterId", getChapterBrainstormingPage);
}

module.exports = Documents;