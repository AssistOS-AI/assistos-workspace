const Controller = require("./controller.js");

const bodyReader = require("../apihub-component-middlewares/bodyReader");

function Logger(server) {
    server.use("/logs/*", bodyReader);

    server.post("/logs/:spaceId", Controller.createLog);

    server.get("/logs/:spaceId", Controller.getLogs);
    server.get("/logs/:spaceId/:logId", Controller.getLog);

}

module.exports = Logger;
