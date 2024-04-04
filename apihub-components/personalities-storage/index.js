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

function PersonalitiesStorage(server){
    const { loadKnowledge, loadFilteredKnowledge, addKnowledge, storeKnowledge, loadDefaultPersonalities } = require("./controller");
    server.get("/personalities/default", loadDefaultPersonalities);
    server.get("/personalities/:spaceId/:personalityId", loadKnowledge);
    server.get("/personalities/:spaceId/:personalityId/search", loadFilteredKnowledge);
    server.use("/personalities/*", bodyReaderMiddleware);
    server.put("/personalities/:spaceId/:personalityId/add", addKnowledge);
    server.put("/personalities/:spaceId/:personalityId/store", storeKnowledge);
}

module.exports = PersonalitiesStorage;