const bodyReader = require("../apihub-component-middlewares/bodyReader");
const authentication = require("../apihub-component-middlewares/authentication");
const {
    notifyClient,
    registerClient
} = require("./controller");

function webhook(server) {
    server.use("/webhook/*", bodyReader);
    server.use("/webhook/sse/*", authentication);
    server.post("/webhook/data", notifyClient);
    server.get("/webhook/sse/:clientId", registerClient);
}
module.exports = webhook;