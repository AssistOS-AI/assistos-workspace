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

function KnowledgeStorage(server){
    const { loadKnowledge, loadFilteredKnowledge, addKnowledge, storeKnowledge,loadDefaultAgent } = require("./controller");
    server.get("/agents/default",loadDefaultAgent)
    server.get("/agents/:spaceId/:agentId", loadKnowledge);
    server.get("/agents/:spaceId/:agentId/search", loadFilteredKnowledge);
    server.use("/agents/*", bodyReaderMiddleware);
    server.put("/agents/:spaceId/:agentId/add", addKnowledge);
    server.put("/agents/:spaceId/:agentId/store", storeKnowledge);
}

module.exports = KnowledgeStorage;