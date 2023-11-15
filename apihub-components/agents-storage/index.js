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
    const { loadAgent, storeAgent } = require("./controller");
    server.get("agents/:spaceId/:agentId", loadAgent);
    server.use("/spaces/*", bodyReaderMiddleware);
    server.put("agents/:spaceId/:agentId", storeAgent);
}

module.exports = SpaceStorage;