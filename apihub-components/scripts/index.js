const { getScripts } = require("../scripts/controller");

function Scripts(server) {
    const { getScripts } = require("./controller");
    server.get("/company/:currentCompanyId/myspace/scripts", getScripts);
}

module.exports = Scripts;