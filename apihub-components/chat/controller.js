const Request = require('../apihub-component-utils/utils')
const Handler = require('./handler.js')


const getChatMessages = async function (request, response) {
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    try {
        const chat = await Handler.getChatMessages(spaceId, chatId);
        return Request.sendResponse(response, 200, "application/json", {
            message: `Chat ${chatId} from Space ${spaceId} loaded successfully`,
            data: chat
        })
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered error ${error.message} while trying to load chat ${chatId} from space ${spaceId}`
        })
    }
}

const createChat = async function (request, response) {
    const spaceId = request.params.spaceId;
    const personalityId = request.params.personalityId;
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    try {
        const chatId = await Handler.createChat(spaceId, personalityId);
        return Request.sendResponse(response, 200, "application/json", {
            message: `Successfully created chat ${chatId}`,
            data: {chatId}
        })
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered an error:${error.message} while trying to create a new chat`
        })
    }
}


const sendMessage = async function (request, response) {
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    const userId = request.userId;
    const {message} = request.body;
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    try {
        const messageId = await Handler.sendMessage(spaceId, chatId, userId, message, "user");
        return Request.sendResponse(response, 200, "application/json", {
            message: `Successfully added message ${messageId}`,
            data: {messageId}
        })
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered an error : ${error.message} while trying to add message to space ${spaceId}, chat ${chatId}`
        })
    }
}

const watchChat = async function (request, response) {
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    const userId = request.userId;
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }

    try {
        await Handler.watchChat(spaceId, chatId, userId);
        return Request.sendResponse(response, 200, "application/json", {message: `Successfully started watching chat ${chatId} from space ${spaceId}`})
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {message: `Encountered an error : ${error.message} while trying to watch chat ${chatId} from space ${spaceId}`})
    }
}

const sendQuery = async function (request, response) {
    const userId = request.userId;
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    const personalityId = request.params.personalityId;

    const {prompt} = request.body;

    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!personalityId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid personalityId received ${personalityId}`
        })
    }
    try {
        await Handler.sendQuery(request, response, spaceId, chatId, personalityId,userId, prompt)
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered an error : ${error.message} while trying to send query to chat ${chatId} from space ${spaceId}`
        })
    }
}

const resetChat = async function (request, response) {
    const spaceId = request.params.spaceId;
    const chatId = request.params.chatId;
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    try {
        await Handler.resetChat(spaceId, chatId);
        return Request.sendResponse(response, 200, "application/json", {message: `Chat ${chatId} reset successfully`})
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered an error : ${error.message} while trying to reset chat ${chatId} from space ${spaceId}`
        })
    }
}

const resetChatContext = async function (request, response) {
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    try {
        await Handler.resetChatContext(spaceId, chatId);
        return Request.sendResponse(response, 200, "application/json", {
            message: `Chat ${chatId} from Space ${spaceId} loaded successfully`,
            data: {chatId}
        })
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered error ${error.message} while trying to load chat ${chatId} from space ${spaceId}`
        })
    }
}

const getChatContext = async function(request,response){
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    try {
        const chatContext = await Handler.getChatContext(spaceId, chatId);
        return Request.sendResponse(response, 200, "application/json", {
            message: `Chat ${chatId} from Space ${spaceId} loaded successfully`,
            data: chatContext
        })
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered error ${error.message} while trying to load chat ${chatId} from space ${spaceId}`
        })
    }
}

const addMessageToContext = async function(request,response){
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    const messageId = request.params.messageId;
    if (!chatId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    if(!messageId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid messageId received ${messageId}`
        })
    }
    try {
        await Handler.addMessageToContext(spaceId, chatId,messageId);
        return Request.sendResponse(response, 200, "application/json", {
            message: ``
        })
    } catch (error) {
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: ``
        })
    }
}

const getPublicChat = async function (request, response) {

}

const createPublicChat = async function (request, response) {

}

const sendPublicMessage = async function (request, response) {

}

const sendPublicQuery = async function (request, response) {

}

const updateChatContextItem = async function (request,response){
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    const contextItemId = request.params.contextItemId;
    const {context} = request.body;

    if(!spaceId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    if(!chatId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if(!contextItemId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid contextItemId received ${contextItemId}`
        })
    }
    try{
        await Handler.updateChatContextItem(spaceId, chatId,contextItemId,context);
        return Request.sendResponse(response, 200, "application/json", {
            message: `Updated Chat Context Item successfully`
        })
    }catch(error){
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered an error : ${error.message} while trying to update chat context item ${contextItemId} from chat ${chatId} in space ${spaceId}`
        })
    }
}
const deleteChatContextItem = async function (request,response){
    const chatId = request.params.chatId;
    const spaceId = request.params.spaceId;
    const contextItemId = request.params.contextItemId;

    if(!spaceId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    if(!chatId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid chatId received ${chatId}`
        })
    }
    if(!contextItemId){
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid contextItemId received ${contextItemId}`
        })
    }
    try{
        await Handler.deleteChatContextItem(spaceId, chatId,contextItemId);
        return Request.sendResponse(response, 200, "application/json", {
            message: `Deleted Chat Context Item successfully`
        })
    }catch(error){
        return Request.sendResponse(response, error.statusCode || 500, "application/json", {
            message: `Encountered an error : ${error.message} while trying to delete chat context item ${contextItemId} from chat ${chatId} in space ${spaceId}`
        })
    }
}
module.exports = {
    getChatMessages, createChat, watchChat, sendMessage, sendQuery, resetChat,getChatContext,resetChatContext,addMessageToContext,updateChatContextItem,deleteChatContextItem,
    getPublicChat, createPublicChat, sendPublicMessage, sendPublicQuery
}
