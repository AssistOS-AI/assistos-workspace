const bodyReader = require("../apihub-component-middlewares/bodyReader");
const controller = require("./controller.js");

function TelegramChat(server) {
    server.use("/telegram/*", bodyReader);
    server.get("/telegram/getUpdates", controller.getUpdates);
    server.post("/telegram/:spaceId/:personalityId", controller.receiveMessage);
    server.post("/telegram/startBot/:spaceId/:personalityId", controller.startBot);
}
module.exports = TelegramChat;
