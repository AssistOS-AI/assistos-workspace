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
    const { loadObject, storeObject, loadSpace, storeSpace } = require("./controller");
    server.get("/spaces/:spaceId/:objectType/:objectName", loadObject);
    server.get("/load-space/:spaceId", loadSpace);
    server.delete("/spaces/:spaceId/:objectType/:objectName", storeObject);
    server.use("/spaces/*", bodyReaderMiddleware);
    server.put("/spaces/:spaceId/:objectType/:objectName", storeObject);
    server.put("/spaces/:spaceId", storeSpace);
}

module.exports = SpaceStorage;