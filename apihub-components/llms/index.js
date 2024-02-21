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
    const {generateResponse,executeFlow} = require("./controller");
    server.use("/llms/*", bodyReaderMiddleware);
    server.put("/llms/generate", generateResponse);
    server.post("/llms/:spaceId/executeFlow/:flowId/:applicationId", executeFlow);
}

module.exports = SpaceStorage;