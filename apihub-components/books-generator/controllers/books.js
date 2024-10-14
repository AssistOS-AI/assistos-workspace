const util = require('../../apihub-component-utils/utils.js')
const booksService = require('../services/books.js')
const crypto=require('../../apihub-component-utils/crypto.js')

async function getBooks(req, res) {
    const spaceId = req.params.spaceId;
    try {
        const books = await booksService.getBooks(spaceId);
        return util.sendResponse(res, 200, 'application/json', {
            data: books,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function getBook(req, res) {
    const spaceId = req.params.spaceId;
    const bookId = req.params.bookId;
    try {
        const bookResponse = await booksService.getBook(spaceId, bookId);
        bookResponse.fileStream.pipe(res);
        return util.sendResponse(res, 200, 'application/json', {
            data: book,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function addBook(req, res) {
    const spaceId = req.params.spaceId;
    const bookData = req.body;
    const bookId = crypto.generateId();
    try {
        const book = await booksService.addBook(spaceId,bookId, bookData);
        return util.sendResponse(res, 200, 'application/json', {
            data: book,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function updateBook(req, res) {
    const spaceId = req.params.spaceId;
    const bookId = req.params.bookId;
    const bookData = req.body;
    try {
        const book = await booksService.updateBook(spaceId, bookId, bookData);
        return util.sendResponse(res, 200, 'application/json', {
            data: book,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

async function deleteBook(req, res) {
    const spaceId = req.params.spaceId;
    const bookId = req.params.bookId;
    try {
        await booksService.deleteBook(spaceId, bookId);
        return util.sendResponse(res, 200, 'application/json', {
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}
async function generateBook(req, res) {
    const spaceId = req.params.spaceId;
    const templateId = req.params.templateId;
    try {
        const bookId = await booksService.generateBook(req,spaceId, templateId);
        return util.sendResponse(res, 200, 'application/json', {
            data: bookId,
            success: true
        });
    } catch (error) {
        return util.sendResponse(res, error.statusCode || 500, 'application/json', {
            message: error.message,
            success: false
        });
    }
}

module.exports = {
    getBooks,
    getBook,
    addBook,
    updateBook,
    deleteBook,
    generateBook
}
