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
    const { loadObject,storeObject} = require("./controller");
    server.get("/spaces/:spaceId/:objectPathId",loadObject);
    server.use("/spaces/*", bodyReaderMiddleware);
    server.put("/spaces/:spaceId/:objectPathId",storeObject);
}
module.exports=Storage;