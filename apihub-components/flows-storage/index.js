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
    const { loadDefaultFlows,loadDefaultPersonalities } = require("./controller");
    server.get("/flows/default", loadDefaultFlows);
    server.get("/personalities/default", loadDefaultPersonalities);

    server.use("/spaces/*", bodyReaderMiddleware);
}

module.exports = SpaceStorage;