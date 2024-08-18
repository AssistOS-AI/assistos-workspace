const bodyReader = require("../apihub-component-middlewares/bodyReader");
const {
    dataHandler
} = require("./controller");

function webhook(server) {
    server.use("/webhook/*", bodyReader);
    server.use("/webhook/*", async (request,response)=>{let abc; debugger;});
    server.post("/webhook/data", dataHandler);
}
module.exports = webhook;