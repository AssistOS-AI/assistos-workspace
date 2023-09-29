function Documents(server) {
    const { getDocumentPage, getDocumentTitlePage, getDocumentAbstractPage, getDocumentSettingsPage, getManageChaptersPage, getChapterTitlePage, getManageParagraphsPage, getParagraphProofreadPage, getParagraphEditPage } = require("./controller");

    server.get("/documents/:documentId", getDocumentPage);
    server.get("/documents/:documentId/edit-title", getDocumentTitlePage);
    server.get("/documents/:documentId/edit-abstract", getDocumentAbstractPage);
    server.get("/documents/:documentId/settings", getDocumentSettingsPage);
    server.get("/documents/:documentId/manage-chapters", getManageChaptersPage);
    server.get("/documents/:documentId/edit-chapter-title/:chapterId", getChapterTitlePage);
    server.get("/documents/:documentId/manage-paragraphs/:chapterId", getManageParagraphsPage);
    server.get("/documents/:documentId/paragraph-proofread/:chapterId/:paragraphId", getParagraphProofreadPage);
    server.get("/documents/:documentId/paragraph-edit/:chapterId/:paragraphId", getParagraphEditPage);
}

module.exports = Documents;