const utils = require('../apihub-component-utils/utils.js');
const secrets = require("../apihub-component-utils/secrets");
const cookie = require("../apihub-component-utils/cookie");
async function getUpdates(spaceId, personality, botId, llmModule) {
    let response = await fetch (`https://api.telegram.org/bot${botId}/getUpdates`);
    if(!response.ok){
        throw new Error(response.statusText);
    }
    let data = await response.json();
    let messages = data.result;
    if(messages.length === 0){
        return;
        // no messages yet
    }
    let latestMessage = messages[messages.length - 1];
    let chat = personality.telegramBot.chats.find(chat => chat.id === latestMessage.message.chat.id);
    if(chat){
        if(chat.lastUpdateId === latestMessage.update_id){
            return;
        }
    }else {
        if(latestMessage.message){
            return;
        }
        chat = {
            id: latestMessage.message.chat.id,
            lastUpdateId: latestMessage.update_id
        }
        personality.telegramBot.chats.push(chat);
        let personalityModule = await loadAssistOSModule("personality");
        await personalityModule.updatePersonality(spaceId, personality.id, personality);
    }
    if(latestMessage.message){
        return;
    }
    chat.lastUpdateId = latestMessage.update_id;
    let chatId = latestMessage.message.chat.id;
    try {
        let llmResponse = await llmModule.generateText(spaceId, latestMessage.message.text, personality.id);
        await sendMessage(botId, chatId, llmResponse.message);
    } catch (e) {
        await sendMessage(botId, chatId, "Something went wrong. Please try again");
        throw new Error(e.message);
    }
}
async function loadAssistOSModule(moduleName) {
    let authSecret = await secrets.getApiHubAuthSecret();
    let securityContextConfig = {
        headers: {
            cookie: cookie.createApiHubAuthCookies(authSecret, this.userId, this.spaceId)
        }
    }
    const SecurityContext = require('assistos').ServerSideSecurityContext;
    let securityContext = new SecurityContext(securityContextConfig);
    return require('assistos').loadModule(moduleName, securityContext);
}
async function sendMessage(botId, chatId, text){
    await fetch(`https://api.telegram.org/bot${botId}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text
        })
    });
}
async function startBot(req, res){
    let botId = req.body;
    let personalityId = req.params.personalityId;
    let spaceId = req.params.spaceId;
    try {
        let SecurityContext = require("assistos").ServerSideSecurityContext;
        let securityContext = new SecurityContext(req);
        let personalityModule = require("assistos").loadModule("personality", securityContext);
        let personality = await personalityModule.getPersonality(spaceId, personalityId);
        personality.telegramBot = {
            botId: botId,
            chats: []
        }
        await personalityModule.updatePersonality(spaceId, personalityId, personality);
        let baseURL = process.env.BASE_URL;
        let webhookURL = `${baseURL}/telegram/${spaceId}/${personalityId}`;
        await fetch(`https://api.telegram.org/bot${botId}/setWebhook?url=${webhookURL}`)

        utils.sendResponse(res, 200, "application/json", {
            data: `Registered bot with id ${botId}, webhook URL: ${webhookURL}`
        });
    } catch (e) {
        utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }
}
async function receiveMessage(req, res){
    let spaceId = req.params.spaceId;
    let personalityId = req.params.personalityId;

    let message = req.body.message;
    if(!message){
        return utils.sendResponse(res, 200, "application/json", {});
    }
    let chatId = message.chat.id;
    let personalityModule = await loadAssistOSModule("personality");
    let personality = await personalityModule.getPersonality(spaceId, personalityId);
    let chat = personality.telegramBot.chats.find(chat => chat.id === message.chat.id);
    if(!chat){
        chat = {
            id: message.chat.id,
            lastUpdateId: req.body.update_id
        }
        personality.telegramBot.chats.push(chat);
        await personalityModule.updatePersonality(spaceId, personality.id, personality);
    }
    let llmModule = await loadAssistOSModule("llm");
    try {
        let llmResponse = await llmModule.generateText(spaceId, message.text, personality.id);
        await sendMessage(personality.telegramBot.botId, chatId, llmResponse.message);
    } catch (e) {
        await sendMessage(personality.telegramBot.botId, chatId, "Something went wrong. Please try again");
        throw new Error(e.message);
    }
}
module.exports = {
    getUpdates,
    startBot,
    receiveMessage
}