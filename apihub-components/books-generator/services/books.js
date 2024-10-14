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

async function generateBook(request, spaceId, templateId) {

    function readableToBuffer(readableStream) {
        return new Promise((resolve, reject) => {
            const chunks = [];

            readableStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            readableStream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            readableStream.on('error', (err) => {
                reject(err);
            });
        });
    }

    async function convertBufferToJson(readableStream) {
        try {
            const buffer = await readableToBuffer(readableStream);

            const jsonString = buffer.toString('utf-8');

            const jsonObject = JSON.parse(jsonString);

            return jsonObject;
        } catch (err) {
            console.error('Error during conversion:', err);
        }
    }

    const fileResponse = await Storage.getFile(spaceId, 'templates', templateId);

    const bookTemplate = await convertBufferToJson(fileResponse);

    const securityContext = {
        userId: request.userId,
        spaceId: spaceId,
        cookie: request.cookie,
    };

    const generateBookTask = new GenerateBookTask(securityContext, spaceId, 'userId', bookTemplate);
    const bookData = await generateBookTask.runTask();

}

module.exports = {
    getBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    generateBook
}
