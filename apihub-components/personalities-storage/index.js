const bodyReader=require("../apihub-component-middlewares/bodyReader");
const {
    ensurePersonalitiesDefaultLllms
} = require("./controller");

function PersonalitiesStorage(server){
    server.use("/personalities/*", bodyReader);
    server.post("/personalities/:spaceId/ensure-default-llms",ensurePersonalitiesDefaultLllms);
}

module.exports = PersonalitiesStorage;