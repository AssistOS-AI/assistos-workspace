const {storeScript} = require("./controller");

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
    const { loadDefaultScripts, loadScript, storeScript } = require("./controller");
    server.get("/scripts/default", loadDefaultScripts);
    //server.get("/scripts/:spaceId/:scriptId", loadScript);
    //server.delete("/scripts/:spaceId/:scriptId", storeScript);
    server.use("/spaces/*", bodyReaderMiddleware);
    //server.put("/scripts/:spaceId/:scriptId", storeScript);
}

module.exports = SpaceStorage;