const logger = $$.getLogger("brand", "apihub-components");
const openDSU = require("opendsu");

async function getDocumentPage(request, response) {
    const documentId = request.params.documentId;
    let postsPage = "";
    postsPage += `
                <doc-page-by-title data-document-id="${documentId}" data-presenter="doc-page-by-title"></doc-page-by-title>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(postsPage);
    response.end();
}

module.exports = {
    getDocumentPage,
};
