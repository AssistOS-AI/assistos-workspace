const bodyReader=require("../apihub-component-middlewares/bodyReader");

function PersonalitiesStorage(server){
    const { loadKnowledge, loadFilteredKnowledge, addKnowledge, storeKnowledge } = require("./controller");
    server.get("/personalities/:spaceId/:personalityId", loadKnowledge);
    server.get("/personalities/:spaceId/:personalityId/search", loadFilteredKnowledge);
    server.use("/personalities/*", bodyReader);
    server.put("/personalities/:spaceId/:personalityId/add", addKnowledge);
    server.put("/personalities/:spaceId/:personalityId/store", storeKnowledge);
}

module.exports = PersonalitiesStorage;