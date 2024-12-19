const Controller = require("./controller.js");

const bodyReader = require("../apihub-component-middlewares/bodyReader");
const authentication = require("../apihub-component-middlewares/authentication");
const authorization = require("../apihub-component-middlewares/authorization");

function Logger(server) {
    server.use("/logs/*", bodyReader);
    server.use("/logs/*", authentication);
    server.use("/logs/*", authorization);

    server.post("/logs/:spaceId", Controller.createLog);
    server.get("/logs/:spaceId", Controller.getLogs);
    server.get("/logs/:spaceId/:logId", Controller.getLog);

}

module.exports = Logger;
