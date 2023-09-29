const logger = $$.getLogger("brand", "apihub-components");

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
                <document-view-page data-document-id="${documentId}" data-presenter="document-view-page"></document-view-page>
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

async function getManageChaptersPage(request, response) {
    const documentId = request.params.documentId;
    let documentPage = "";
    documentPage += `
                <manage-chapters-page data-document-id="${documentId}" data-presenter="manage-chapters-page"></manage-chapters-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getChapterTitlePage(request, response) {
    const documentId = request.params.documentId;
    const chapterId = request.params.chapterId;
    let documentPage = "";
    documentPage += `
                <chapter-title-page data-document-id="${documentId}" data-chapter-id="${chapterId}" data-presenter="chapter-title-page"></chapter-title-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getManageParagraphsPage(request, response) {
    const documentId = request.params.documentId;
    const chapterId = request.params.chapterId;
    let documentPage = "";
    documentPage += `
                <manage-paragraphs-page data-document-id="${documentId}" data-chapter-id="${chapterId}" data-presenter="manage-paragraphs-page"></manage-paragraphs-page>
                `;

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getParagraphProofreadPage(request, response) {
    const documentId = request.params.documentId;
    const chapterId = request.params.chapterId;
    const paragraphId = request.params.paragraphId;
    let documentPage = "";
    documentPage += `
                <paragraph-proofread-page data-document-id="${documentId}" data-chapter-id="${chapterId}" data-paragraph-id="${paragraphId}" data-presenter="paragraph-proofread-page"></paragraph-proofread-page>
                `

    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(documentPage);
    response.end();
}

async function getParagraphEditPage(request, response) {
    const documentId = request.params.documentId;
    const chapterId = request.params.chapterId;
    const paragraphId = request.params.paragraphId;
    let documentPage = "";
    documentPage += `
                <paragraph-edit-page data-document-id="${documentId}" data-chapter-id="${chapterId}" data-paragraph-id="${paragraphId}" data-presenter="paragraph-edit-page"></paragraph-edit-page>
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
    getManageChaptersPage,
    getChapterTitlePage,
    getManageParagraphsPage,
    getParagraphProofreadPage,
    getParagraphEditPage,
};