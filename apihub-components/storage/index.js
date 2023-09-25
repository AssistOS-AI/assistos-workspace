const { storeObject, loadObject, loadSpace } = require("./controller");

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

function Storage(server){
    const { loadObject, storeObject, loadSpace } = require("./controller");
    server.get("/:spaces/:filePath/:objectPath", loadObject);
    server.get("/spaces/:spaceId", loadSpace);
    server.delete("/spaces/:filePath/:objectPath", storeObject);
    server.use("/spaces/*", bodyReaderMiddleware);
    server.put("/spaces/:filePath/:objectPath", storeObject);
}

module.exports = Storage;
