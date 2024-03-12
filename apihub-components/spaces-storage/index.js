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

function SpaceStorage(server) {
    const {loadObject, storeObject, loadSpace, storeSpace,createSpace, storeSecret} = require("./controller");
    /* test routes */
    /*
        server.get("/space/:spaceId", (req, res) => {getSpace(req,res)});
      server.put("/space/:spaceId", (req, res) => {updateSpace(req,res)});
      server.delete("/space/:spaceId", (req, res) => {deleteSpace(req,res)});*/

    server.post("/spaces", (req, res) => {createSpace(req,res)});
    server.get("/spaces/:spaceId/:objectType/:objectName", loadObject);
    server.get("/load-space/:spaceId", loadSpace);
    server.delete("/spaces/:spaceId/:objectType/:objectName", storeObject);
    server.post("/spaces/:spaceId/secrets", async (request, response) => {
        await storeSecret(request, response, server)
    });
    server.use("/spaces/*", bodyReaderMiddleware);
    server.put("/spaces/:spaceId/:objectType/:objectName", storeObject);
    server.put("/spaces/:spaceId", async (request, response) => {
        await storeSpace(request, response, server)
    });
}

module.exports = SpaceStorage;