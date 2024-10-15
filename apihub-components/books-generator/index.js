const bookHandler = require('./controllers/books.js');
const templateHandler = require('./controllers/templates.js');

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function booksGenerator(server) {
    server.use("/books-generator/*", bodyReader);
    server.use("/books-generator/*", authentication);

    // Templates
    server.get("/books-generator/templates/:spaceId", templateHandler.getTemplates);
    server.get("/books-generator/templates/:spaceId/:templateId", templateHandler.getTemplate);

    server.post("/books-generator/templates/:spaceId", templateHandler.addTemplate);
    server.put("/books-generator/templates/:spaceId/:templateId", templateHandler.updateTemplate);
    server.delete("/books-generator/templates/:spaceId/:templateId", templateHandler.deleteTemplate);

    server.post("/books-generator/templates/generate/:spaceId", templateHandler.generateTemplate);
    // Books
    server.get("/books-generator/books/:spaceId", bookHandler.getBooks);
    server.get("/books-generator/books/:spaceId/:bookId", bookHandler.getBook);

    server.post("/books-generator/books/:spaceId", bookHandler.addBook);
    server.put("/books-generator/books/:spaceId/:bookId", bookHandler.updateBook);
    server.delete("/books-generator/books/:spaceId/:bookId", bookHandler.deleteBook);

    server.post("/books-generator/books/generate/:spaceId/:templateId", bookHandler.generateBook);
}

module.exports = booksGenerator;
