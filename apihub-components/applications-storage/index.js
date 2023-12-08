const {
    installApplication,
    uninstallApplication,
    resetApplication,
    updateApplicationFlow
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
    server.post("/space/:spaceId/applications/:applicationId", installApplication);
    server.delete("/space/:spaceId/applications/:applicationId", uninstallApplication);
    server.post("/space/:spaceId/applications/:applicationId/reset", resetApplication);
    server.put("/space/:spaceId/applications/:applicationId/flows/:flowId", updateApplicationFlow);
}

module.exports = ApplicationsStorage;