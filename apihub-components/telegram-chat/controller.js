const utils = require('../apihub-component-utils/utils.js');
const secrets = require("../apihub-component-utils/secrets");
const cookie = require("../apihub-component-utils/cookie");
const {promises: fsPromises} = require("fs");
const User = require("../users-storage/user");
const configs = require("../../data-volume/config/config.json");
const Email = require("../email/index.js").instance;
const chatHandler = require("../chat/handler");
async function loadAssistOSModule(moduleName, spaceId, userId){
    let authSecret = await secrets.getApiHubAuthSecret();
    let securityContextConfig = {
        headers: {
            cookie: cookie.createApiHubAuthCookies(authSecret, userId, spaceId)
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
        let result = await fetch(`https://api.telegram.org/bot${botId}/getMe`);
        if(!result.ok){
            return utils.sendResponse(res, 400, "application/json", {
                message: "Invalid bot id"
            });
        }
        let botData = await result.json();
        let SecurityContext = require("assistos").ServerSideSecurityContext;
        let securityContext = new SecurityContext(req);
        let personalityModule = require("assistos").loadModule("personality", securityContext);
        let personality = await personalityModule.getPersonality(spaceId, personalityId);
        personality.telegramBot = {
            username: botData.result.username,
            name: botData.result.first_name,
            id: botId,
            users: [],
            public: false
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
function isValidEmail(string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(string);
}
async function checkUserExists(res, spaceId, personality, message){
    let telegramUserId = message.from.id;
    let chatId = message.chat.id;
    let authenticatedUser = personality.telegramBot.users.find(user => user.telegramUserId === telegramUserId);
    let pendingUser = pendingUsers.find(user => user.id === telegramUserId);
    if(!authenticatedUser && !pendingUser){
        await sendMessage(personality.telegramBot.id, chatId, `Hello user. To use this bot please enter your email address linked to your assistOS account.`);
        pendingUsers.push({
            id: message.from.id,
            firstName: message.from.first_name,
            lastName: message.from.last_name,
            timestamp: Date.now()
        });
        return false;
    }
    if(pendingUser){
        if(isValidEmail(message.text)){
            await sendVerificationMail(spaceId, personality, message.text, telegramUserId, chatId);
        } else {
            await sendMessage(personality.telegramBot.id, chatId, `Invalid email address. Please enter a valid email address`);
        }
        return false;
    }
    return true;
}
async function sendVerificationMail(spaceId, personality, email, telegramUserId, chatId){
    let users = await User.getUserMap();
    let userId = users[email];
    let endpoint = `telegram/auth/${spaceId}/${personality.id}/${telegramUserId}/${userId}`;
    if(configs.ENABLE_EMAIL_SERVICE){
        try {
            await Email.sendAssistOSMail(email,
                "AssistOS telegram bot authentication",
                "AssistOS telegram bot authentication",
                "Please click on the button below to verify your email address",
                `Verify email`,
                endpoint);
        }catch (e) {
            await sendMessage(personality.telegramBot.id, chatId, `Something went wrong while verifying your mail. ${e.message}`);
        }
        await sendMessage(personality.telegramBot.id, chatId, `I have sent a verification email to ${email}. Please click on the button in the email to authenticate yourself.`);
    }else{
        const baseURL= process.env.BASE_URL;
        const url = `${baseURL}/${endpoint}`;
        try {
            await fetch(url);
            await sendMessage(personality.telegramBot.id, chatId, `Email verified successfully.`);
        } catch (e) {
            await sendMessage(personality.telegramBot.id, chatId, `Something went wrong while verifying your mail locally. ${e.message}`);
        }
    }
}
let pendingUsers = [];
async function receiveMessage(req, res){
    let spaceId = req.params.spaceId;
    let personalityId = req.params.personalityId;
    let message = req.body.message;
    if(!message){
        return utils.sendResponse(res, 200, "application/json", {});
    }

    let chatId = message.chat.id;
    let personalityModule = await loadAssistOSModule("personality", spaceId);
    let personality = await personalityModule.getPersonality(spaceId, personalityId);
    if(personality.telegramBot.public){
        //???
        return;
    }
    let userExists = await checkUserExists(res, spaceId, personality, message);
    if(!userExists){
        return utils.sendResponse(res, 200, "application/json", {});
    }
    let user = personality.telegramBot.users.find(user => user.telegramUserId === message.from.id);
    if(message.sticker){
        await sendMessage(personality.telegramBot.id, chatId, "Im sorry I cannot process stickers");
        return utils.sendResponse(res, 200, "application/json", {});
    }
    try {
        let llmResponse = await chatHandler.sendQuery(spaceId, user.chatId, personalityId, user.id, message.text);
        await sendMessage(personality.telegramBot.id, chatId, llmResponse);
    } catch (e) {
        try {
            let errorMessage = JSON.parse(e.message);
            if(errorMessage.message.includes("APIKey")){
                await sendMessage(personality.telegramBot.id, chatId, "APIKey for this personality is missing.");
                return;
            }
        } catch (e) {}
        await sendMessage(personality.telegramBot.id, chatId, "Something went wrong. Please try again");
        throw new Error(e.message);
    } finally {
        utils.sendResponse(res, 200, "application/json", {});
    }
}
async function sendErrorResponse(res, message, statusCode = 500){
    if(configs.ENABLE_EMAIL_SERVICE){
        const activationFailHTML = await User.getActivationFailHTML(message);
        await utils.sendFileToClient(res, activationFailHTML, "html", statusCode)
    }else{
        return utils.sendResponse(res, statusCode, "application/json", {
            message: message
        });
    }
}
let pendingTimeout = 1000 * 60 * 60 * 24; // 24 hours
async function authenticateUser(req, res){
    let spaceId = req.params.spaceId;
    let personalityId = req.params.personalityId;
    let telegramUserId = parseInt(req.params.telegramUserId);
    let userId = req.params.userId;
    let pendingUser = pendingUsers.find(user => user.id === telegramUserId);
    if(!pendingUser){
        await sendErrorResponse(res, "Pending User not found", 422);
    }
    let currentTime = Date.now();
    if(currentTime - pendingUser.timestamp > pendingTimeout){
        pendingUsers = pendingUsers.filter(user => user.id !== telegramUserId);
        await sendErrorResponse(res, "Verification link expired", 401);
    }
    try{
        let personalityModule = await loadAssistOSModule("personality", spaceId);
        let personality = await personalityModule.getPersonality(spaceId, personalityId);
        if(!personality){
            await sendErrorResponse(res, "Personality not found", 422);
        }

        let {chatId} = await personalityModule.createChat(spaceId, personalityId);

        personality.telegramBot.users.push({
            id: userId,
            telegramUserId: pendingUser.id,
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            chatId: chatId
        })
        await personalityModule.updatePersonality(spaceId, personalityId, personality);


        pendingUsers = pendingUsers.filter(user => user.id !== telegramUserId);
        if(configs.ENABLE_EMAIL_SERVICE){
            await sendMessage(personality.telegramBot.id, telegramUserId, "Email verified successfully.");
            const activationSuccessHTML = await User.getActivationSuccessHTML();
            await utils.sendFileToClient(res, activationSuccessHTML, "html",200)
        }else{
            return utils.sendResponse(res, 200, "application/json", {
                message: ""
            });
        }
    }catch (e) {
        await sendErrorResponse(res, e.message);
    }
}
async function removeUser(req, res){
    let spaceId = req.params.spaceId;
    let personalityId = req.params.personalityId;
    let telegramUserId = parseInt(req.body);
    try {
        let SecurityContext = require("assistos").ServerSideSecurityContext;
        let securityContext = new SecurityContext(req);
        let personalityModule = require("assistos").loadModule("personality", securityContext);
        let personality = await personalityModule.getPersonality(spaceId, personalityId);
        personality.telegramBot.users = personality.telegramBot.users.filter(user => user.id !== telegramUserId);
        await personalityModule.updatePersonality(spaceId, personalityId, personality);
        utils.sendResponse(res, 200, "application/json", {});
    } catch (e) {
        utils.sendResponse(res, 500, "application/json", {
            message: e.message
        });
    }

}
module.exports = {
    startBot,
    receiveMessage,
    authenticateUser,
    removeUser
}