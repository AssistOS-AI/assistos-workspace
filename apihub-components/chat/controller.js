const Request = require('../apihub-component-utils/utils')
const Handler = require('handler.js')


const getChat = async function (request, response) {
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
        const chat = Handler.getChat()
    } catch (error) {

    }
}
const createChat = async function (request, response) {
    const spaceId = request.params.spaceId;
    if (!spaceId) {
        return Request.sendResponse(response, 400, "application/json", {
            message: `Invalid spaceId received ${spaceId}`
        })
    }
    try {

    } catch (error) {

    }
}
const watchChat = async function (request, response) {
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

    } catch (error) {

    }
}
const sendMessage = async function (request, response) {
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

    } catch (error) {

    }
}
const sendQuery = async function (request, response) {
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

    } catch (error) {

    }
}

module.exports = {
    getChat, createChat, watchChat, sendMessage, sendQuery
}
