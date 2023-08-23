function Document(server) {
    const { getDocumentPage } = require("./controller");
    server.get("/:domain/documents/:documentId", getDocumentPage);
}

module.exports = Document;
