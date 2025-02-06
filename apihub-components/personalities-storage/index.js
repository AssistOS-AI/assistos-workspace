const bodyReader=require("../apihub-component-middlewares/bodyReader");
const {
    ensurePersonalitiesDefaultLllms,
    getDefaultPersonality,
    addPersonality
} = require("./controller");

function PersonalitiesStorage(server){
    server.use("/personalities/*", bodyReader);
    server.get("/personalities/default/:spaceId",getDefaultPersonality);
    server.post("/personalities/:spaceId",addPersonality);
    server.post("/personalities/:spaceId/ensure-default-llms",ensurePersonalitiesDefaultLllms);
}

module.exports = PersonalitiesStorage;