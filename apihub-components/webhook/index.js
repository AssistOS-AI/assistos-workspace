const bodyReader = require("../apihub-component-middlewares/bodyReader");
const authentication = require("../apihub-component-middlewares/authentication");
const {
    notifyClients,
    registerClients
} = require("./controller");

function webhook(server) {
    server.use("/webhook/*", bodyReader);
    server.use("/webhook/*", authentication);
    server.post("/webhook/image", notifyClients);
    server.get("/webhook/image/event", registerClients);
}
module.exports = webhook;