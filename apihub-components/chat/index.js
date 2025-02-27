const Chat = require('./controller')

const bodyReader = require("../apihub-component-middlewares/bodyReader.js");
const authentication = require("../apihub-component-middlewares/authentication.js");


function ChatComponent(server) {
    server.get("/public/chats/:chatId", Chat.getPublicChat)
    server.post("/public/chats", Chat.createPublicChat)
    server.post("/public/chats/:chatId", Chat.sendPublicMessage)
    server.post("/public/chats/query/:chatId", Chat.sendPublicQuery)

    server.use("/chats/*", bodyReader);
    server.use("/chats/*", authentication);

    server.post("/chats/:spaceId/:personalityId", Chat.createChat)
    server.get("/chats/:spaceId/:chatId", Chat.getChatMessages)
    server.get("/chats/context/:spaceId/:chatId", Chat.getChatContext)
    server.post("/chats/context/:spaceId/:chatId/:messageId", Chat.addMessageToContext)

    server.post("/chats/reset/context/:spaceId/:chatId", Chat.resetChatContext)
    server.post("/chats/watch/:spaceId/:chatId", Chat.watchChat)
    server.post("/chats/message/:spaceId/:chatId", Chat.sendMessage)
    server.post("/chats/query/:spaceId/:personalityId/:chatId", Chat.sendQuery)
    server.post("/chats/reset/:spaceId/:chatId", Chat.resetChat)
}

module.exports = ChatComponent;
