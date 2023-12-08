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
    server.use("/spaces/*", bodyReaderMiddleware);
    server.post("/spaces/:spaceId/applications/:applicationId", installApplication);
    server.delete("/spaces/:spaceId/applications/:applicationId", uninstallApplication);
    server.post("/spaces/:spaceId/applications/:applicationId/reset", resetApplication);
    server.put("/spaces/:spaceId/applications/:applicationId/flows/:flowId", updateApplicationFlow);
}

module.exports = ApplicationsStorage;