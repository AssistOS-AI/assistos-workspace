const { getScripts, addScript } = require("../scripts/controller");

function Scripts(server) {
    const { getScripts,  addScript} = require("./controller");
    server.get("/space/:currentCompanyId/myspace/scripts", getScripts);
    server.post("/add/script", addScript);
}

module.exports = Scripts;