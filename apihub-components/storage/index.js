
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
    const { loadObject,storeObject, loadSpace} = require("./controller");
    server.get("/spaces/:spaceId/:objectType/:objectName",loadObject);
    server.get("/spaces/:spaceId///",loadSpace);
    //server.get("/spaces/:spaceId", loadSpace);
    server.delete("/spaces/:spaceId/:objectType//",storeObject);
    server.use("/spaces/*", bodyReaderMiddleware);
    server.put("/spaces/:spaceId/:objectType/:objectName",storeObject);

}

module.exports = Storage;
