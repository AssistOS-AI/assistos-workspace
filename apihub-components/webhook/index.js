const bodyReader = require("../apihub-component-middlewares/bodyReader");
const {
    dataHandler
} = require("./controller");

function webhook(server) {
    server.use("/webhook/*", bodyReader);
    server.post("/webhook/data", dataHandler);
}
module.exports = webhook;