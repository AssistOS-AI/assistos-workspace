const {
    installApplication,
    uninstallApplication,
    resetApplication,
    updateApplicationFlow,
    loadApplicationConfig,
    loadApplicationComponents

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
    server.use("/space/*", bodyReaderMiddleware);
    server.get("/space/:spaceId/applications/:applicationId/configs", loadApplicationConfig);
    server.get("/app/:spaceId/applications/:applicationName/*", loadApplicationComponents);
    server.post("/space/:spaceId/applications/:applicationId", installApplication);
    server.delete("/space/:spaceId/applications/:applicationId", uninstallApplication);
    server.post("/space/:spaceId/applications/:applicationId/reset", resetApplication);
    server.put("/space/:spaceId/applications/:applicationId/flows/:flowId", updateApplicationFlow);
}

module.exports = ApplicationsStorage;