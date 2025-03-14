const Chat = require('./controller')
const bodyReader = require("../apihub-component-middlewares/bodyReader.js");
const authentication = require("../apihub-component-middlewares/authentication.js");
const publicAuthentication = require("../apihub-component-middlewares/publicAuthentication.js");

function ChatComponent(server) {
    server.use("/chats/*", bodyReader);
    server.use("/public/chats/*", bodyReader);

    server.use("/chats/*", authentication);
    server.use("/public/chats/*", publicAuthentication);

    /* Soft Auth (requires only userId cookie, not a valid authentication JWT) */
    server.get("/assets/images/default-personality", Chat.getDefaultPersonalityImage)
    server.get("/public/chats/:spaceId/:chatId", Chat.getChatMessages)
    server.post("/public/chats/:spaceId/:personalityId", Chat.createChat)
    server.post("/public/chats/watch/:spaceId/:chatId", Chat.watchChat)
    server.post("/public/chats/message/:spaceId/:chatId", Chat.sendMessage)
    server.post("/public/chats/query/:spaceId/:personalityId/:chatId", Chat.sendQueryStreaming)
    server.post("/public/chats/send/:spaceId/:personalityId/:chatId", Chat.sendQuery)
    server.post("/public/chats/reset/:spaceId/:chatId", Chat.resetChat)

    server.get("/public/chats/context/:spaceId/:chatId", Chat.getChatContext)
    server.post("/public/chats/context/:spaceId/:chatId/:messageId", Chat.addMessageToContext)
    server.post("/public/chats/reset/context/:spaceId/:chatId", Chat.resetChatContext)
    server.put("/public/chats/context/:spaceId/:chatId/:contextItemId", Chat.updateChatContextItem)
    server.delete("/public/chats/context/:spaceId/:chatId/:contextItemId", Chat.deleteChatContextItem)


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
