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

function FlowsStorage(server){
    const { loadDefaultFlows,loadDefaultPersonalities, loadFlows, storeFlow, storeFlows, loadAppFlows, storeAppFlow} = require("./controller");
    server.get("/flows/default", loadDefaultFlows);
    server.get("/flows/:spaceId", loadFlows);
    server.get("/flows/:spaceId/applications/:applicationId", loadAppFlows);
    server.use("/flows/*", bodyReaderMiddleware);
    server.put("/flows/:spaceId/:objectId", storeFlow);
    server.put("/flows/:spaceId/store/flows", storeFlows);
    server.put("/flows/:spaceId/applications/:applicationId/:objectId", storeAppFlow);
}

module.exports = FlowsStorage;