const logger = $$.getLogger("brand", "apihub-components");
const openDSU = require("opendsu");

async function getDocumentAbstractPage(request, response) {
    const documentId = request.params.documentId;
    let documentPage = "";
    documentPage += `
                <edit-abstract-page data-document-id="${documentId}" data-presenter="edit-abstract-page"></edit-abstract-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getDocumentTitlePage(request, response) {
    const documentId = request.params.documentId;
    let documentPage = "";
    documentPage += `
                <edit-title-page data-document-id="${documentId}" data-presenter="edit-title-page"></edit-title-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getDocumentPage(request, response) {
    const documentId = request.params.documentId;
    let documentPage = "";
    documentPage += `
                <doc-page-by-id data-document-id="${documentId}" data-presenter="doc-page-by-id"></doc-page-by-id>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getDocumentSettingsPage(request, response) {
    const documentId = request.params.documentId;
    let documentPage = "";
    documentPage += `
                <document-settings-page data-document-id="${documentId}" data-presenter="document-settings-page"></document-settings-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getDocumentBrainstormingPage(request, response) {
    const documentId = request.params.documentId;
    let documentPage = "";
    documentPage += `
                <brainstorming-page data-document-id="${documentId}" data-presenter="brainstorming-page"></brainstorming-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

module.exports = {
    getDocumentPage,
    getDocumentTitlePage,
    getDocumentAbstractPage,
    getDocumentSettingsPage,
    getDocumentBrainstormingPage,
};
