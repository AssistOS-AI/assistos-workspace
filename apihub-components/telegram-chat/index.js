const bodyReader = require("../apihub-component-middlewares/bodyReader");
const controller = require("./controller.js");

function TelegramChat(server) {
    server.use("/telegram/*", bodyReader);
    server.post("/telegram/:spaceId/:personalityId", controller.receiveMessage);
    server.post("/telegram/startBot/:spaceId/:personalityId", controller.startBot);
    server.put("/telegram/auth/:spaceId/:personalityId", controller.removeUser);
    server.get("/telegram/auth/:spaceId/:personalityId/:userId", controller.authenticateUser);
}
module.exports = TelegramChat;
