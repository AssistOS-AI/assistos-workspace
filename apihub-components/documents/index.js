function Documents(server) {
    const { getDocumentPage } = require("./controller");
    server.get("/:domain/documents/:documentId", getDocumentPage);
}

module.exports = Documents;
