const bodyReader = require("../apihub-component-middlewares/bodyReader");
const controller = require("./controller.js");

function TelegramChat(server) {
    server.use("/telegram/*", bodyReader);
    server.post("/telegram/:spaceId/:personalityId", controller.receiveMessage);
    server.get("/telegram/auth/:spaceId/:personalityId/:telegramUserId/:userId", controller.authenticateUser);

    //TODO: Add authentication middleware
    server.post("/telegram/startBot/:spaceId/:personalityId", controller.startBot);
    server.put("/telegram/auth/:spaceId/:personalityId", controller.removeUser);
}
module.exports = TelegramChat;
