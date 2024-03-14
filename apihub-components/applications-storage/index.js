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


    server.use("/space/*", bodyReaderMiddleware);
    server.use("/app/*", bodyReaderMiddleware);
    server.post("/space/:spaceId/applications/:applicationId", installApplication);
    server.delete("/space/:spaceId/applications/:applicationId", uninstallApplication);
    server.put("/app/:spaceId/applications/:applicationId/:objectType/:objectId", storeObject);
    server.put("/space/:spaceId/applications/:applicationId/:objectType/:objectId", storeObject);
}

module.exports = ApplicationsStorage;