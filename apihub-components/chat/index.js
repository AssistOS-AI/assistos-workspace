const Chat = require('./controller')

const bodyReader = require("../apihub-component-middlewares/bodyReader.js");
const authentication = require("../apihub-component-middlewares/authentication.js");


function ChatComponent(server) {
    server.get("/public/chats/:chatId", Chat.getPublicChat)
    server.post("/public/chats", Chat.createPublicChat)
    server.post("/public/chats/:chatId", Chat.sendPublicMessage)
    server.post("/public/chats/query/:chatId", Chat.sendPublicQuery)

    server.use("/chats/*", bodyReader);
    /*server.use("/chats/!*", authentication);*/

    server.get("/chats/:spaceId/:chatId", Chat.getChatMessages)
    server.post("/chats/:spaceId/:personalityId", Chat.createChat)
    server.post("/chats/watch/:spaceId/:chatId", Chat.watchChat)
    server.post("/chats/message/:spaceId/:chatId", Chat.sendMessage)
    server.post("/chats/query/:spaceId/:personalityId/:chatId", Chat.sendQueryStreaming)
    server.post("/chats/send/:spaceId/:personalityId/:chatId", Chat.sendQuery)
    server.post("/chats/reset/:spaceId/:chatId", Chat.resetChat)

    server.get("/chats/context/:spaceId/:chatId", Chat.getChatContext)
    server.post("/chats/context/:spaceId/:chatId/:messageId", Chat.addMessageToContext)
    server.post("/chats/reset/context/:spaceId/:chatId", Chat.resetChatContext)
    server.put("/chats/context/:spaceId/:chatId/:contextItemId", Chat.updateChatContextItem)
    server.delete("/chats/context/:spaceId/:chatId/:contextItemId", Chat.deleteChatContextItem)
}

module.exports = ChatComponent;
