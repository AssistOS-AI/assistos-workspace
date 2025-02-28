const spaceModule = require("assistos").loadModule("space", {});
const personalityModule = require("assistos").loadModule("personality", {});

export class TelegramBot{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.personalityPagePresenter = this.element.closest("edit-personality-page").webSkelPresenter;
        this.personality = this.personalityPagePresenter.personality;
        this.invalidate();
    }
    async beforeRender(){
        if(this.personality.telegramBot.id){
            this.telegramBotStatus = `<div class="telegram-bot-status">
            <div class="bot-name">name: ${this.personality.telegramBot.name}</div>
            <div class="bot-username">username: @${this.personality.telegramBot.username}</div>
            </div>`
        }
        let usersHTML = "";
        for(let user of this.personality.telegramBot.users){
            usersHTML += `
            <div class="user">
                <div class="user-first-name">${user.firstName}</div>
                <div class="user-last-name">${user.lastName}</div>
                <img src="/wallet/assets/icons/trash-can.svg" class="delete-user black-icon pointer" data-local-action="removeUser ${user.id}" alt="trash">
            </div>`
        }
        this.usersHTML = usersHTML;
    }
    afterRender(){
        if(this.personality.telegramBot.id){
            let telegramBotInput = this.element.querySelector("#botId");
            telegramBotInput.value = this.personality.telegramBot.id;
            let usersTable = this.element.querySelector(".users-table");
            usersTable.classList.remove("hidden");
        }
    }
    async startTelegramBot(targetElement){
        targetElement.classList.add("loading-icon");
        targetElement.disabled = true;
        targetElement.innerHTML = "";
        let botIdInput = this.element.querySelector("#botId");
        let botId = botIdInput.value;
        if(!botId){
            alert("Please provide a bot id");
            return;
        }
        try {
            await spaceModule.startTelegramBot(assistOS.space.id, this.personality.id, botId);
            assistOS.showToast("Bot Started", "success");
        } catch (e) {
            assistOS.showToast(e.message, "fail");
        } finally {
            targetElement.classList.remove("loading-icon");
            targetElement.disabled = false;
            targetElement.innerHTML = "Start Bot";
        }
        let personality = await personalityModule.getPersonality(assistOS.space.id, this.personality.id);
        this.personalityPagePresenter.initialPersonality.telegramBot = personality.telegramBot;
        this.personality.telegramBot = personality.telegramBot;
        this.invalidate();
    }
    async removeUser(targetElement, userId){
        let message = "Are you sure you want to remove this user's access to this bot?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (!confirmation) {
            return;
        }
        await spaceModule.removeTelegramUser(assistOS.space.id, this.personality.id, userId);
        let personality = await personalityModule.getPersonality(assistOS.space.id, this.personality.id);
        this.personalityPagePresenter.initialPersonality.telegramBot = personality.telegramBot;
        this.personality.telegramBot = personality.telegramBot;
    }
}