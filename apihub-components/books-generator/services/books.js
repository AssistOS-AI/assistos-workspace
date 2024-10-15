const Storage = require('../../apihub-component-utils/storage.js')
const GenerateBookTask = require('../../tasks/GenerateBook.js')

async function getBooks(spaceId) {
    return await Storage.getFiles(spaceId, 'books');
}

async function getBook(spaceId, bookId) {
    return await Storage.getFile(spaceId, 'books', bookId);
}

async function addBook(spaceId,bookId, bookData) {
    return await Storage.putFile(spaceId, bookId, bookData, "json", "books");
}

async function updateBook(spaceId, bookId, bookData) {
    return await Storage.updateFile(spaceId, 'books', bookId, bookData);
}

async function deleteBook(spaceId, bookId) {
    return await Storage.deleteFile(spaceId, 'books', bookId);
}

async function generateBook(request, spaceId, templateId,bookGenerationConfig) {

    const securityContext = {
        userId: request.userId,
        spaceId: spaceId,
        cookies: request.headers.cookie,
    };

    const documentModule= require("assistos").loadModule("document", securityContext);
    const bookTemplate = await documentModule.getDocument(spaceId, templateId);
    const utilModule= require("assistos").loadModule("util", securityContext);

    bookGenerationConfig={
        ...bookGenerationConfig,
        ...JSON.parse(utilModule.unsanitize(bookTemplate.abstract))
    }
    const generateBookTask = new GenerateBookTask(securityContext, spaceId, 'userId', bookGenerationConfig);
    const bookData = generateBookTask.runTask();
    return generateBookTask.id;
}

module.exports = {
    getBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    generateBook
}
