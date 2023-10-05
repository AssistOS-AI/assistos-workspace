function bodyReaderMiddleware(req, res, next) {
    const data = [];

    req.on('data', (chunk) => {
        data.push(chunk);
    });

    req.on('end', () => {
        req.body = Buffer.concat(data);
        next();
    });
}

function SpaceStorage(server){
    const { generateResponse } = require("./controller");
    server.use("/llms/*", bodyReaderMiddleware);
    server.put("/llms/generate", generateResponse);
}

module.exports = SpaceStorage;