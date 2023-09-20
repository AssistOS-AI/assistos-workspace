const { getScripts, addScript, editScript, deleteScript } = require("../scripts/controller");
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
function Scripts(server) {
    const { getScripts,  addScript, editScript, deleteScript} = require("./controller");
    server.get("/space/:currentSpaceId/myspace/scripts", getScripts);
    server.delete("/space/:currentSpaceId/myspace/scripts/delete/:scriptId", deleteScript);
    server.use("/space/*", bodyReaderMiddleware);
    server.post("/space/:currentSpaceId/myspace/scripts/add", addScript);
    server.put("/space/:currentSpaceId/myspace/scripts/edit/:scriptId", editScript);

}

module.exports = Scripts;