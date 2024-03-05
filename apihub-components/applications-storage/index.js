const {
    installApplication,
    uninstallApplication,
    storeObject,
    loadApplicationConfig,
    loadApplicationFile,
    loadObjects,

} = require("../applications-storage/controller");

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

function ApplicationsStorage(server) {
    server.get("/space/:spaceId/applications/:applicationId/configs", loadApplicationConfig);
    server.get("/app/:spaceId/applications/:appName/:objectType", loadObjects);

    /* :variable e pana intalneste un "/" */

    server.get("/app/:spaceId/applications/:applicationName/file/*", loadApplicationFile);

    //server.get("/app/:spaceId/applications/:applicationName/component/:componentName/:fileType", loadApplicationComponent);

    server.use("/space/*", bodyReaderMiddleware);
    server.use("/app/*", bodyReaderMiddleware);
    server.post("/space/:spaceId/applications/:applicationId/:userId", async (request, response)=>{
        await installApplication(server, request, response);
    });
    server.delete("/space/:spaceId/applications/:applicationId/:userId", async (request, response)=>{
        await uninstallApplication(server, request, response);
    });
    server.put("/app/:spaceId/applications/:applicationId/:objectType/:objectId", storeObject);
    server.put("/space/:spaceId/applications/:applicationId/:objectType/:objectId", storeObject);
}

module.exports = ApplicationsStorage;