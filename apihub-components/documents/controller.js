const logger = $$.getLogger("brand", "apihub-components");
const openDSU = require("opendsu");

async function getDocumentTitlePage(request, response) {
    const documentId = request.params.documentId;
    let postsPage = "";
    postsPage += `
                <edit-title-page data-document-id="${documentId}" data-presenter="edit-title-page"></edit-title-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(postsPage);
    response.end();
}

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
    getDocumentTitlePage
};
