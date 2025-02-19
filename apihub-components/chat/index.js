const Chat = require('./controller')

const bodyReader=require("../apihub-component-middlewares/bodyReader.js");
const authentication=require("../apihub-component-middlewares/authentication.js");

function ChatComponent(server) {
    server.use("/chats/*", bodyReader);
    server.use("/chats/protected/*", authentication);

    server.post("/chats/:spaceId",Chat.createChat)
    server.get("/chats/:spaceId/:chatId",Chat.getChat)
    server.post("/chats/watch/:spaceId/:chatId",Chat.watchChat)
    server.post("/chats/message/:spaceId/:chatId",Chat.sendMessage)
    server.post("/chats/query/:spaceId/:chatId",Chat.sendQuery)

}

module.exports = ChatComponent;
