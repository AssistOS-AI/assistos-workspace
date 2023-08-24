function Documents(server) {
    const { getDocumentPage } = require("./controller");
    server.get("/documents/:documentId", getDocumentPage);
}

module.exports = Documents;
