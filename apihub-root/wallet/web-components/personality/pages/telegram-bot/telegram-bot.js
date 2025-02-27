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
    beforeRender(){
        if(this.personality.telegramBot.id){
            this.telegramBotStatus = `<div class="telegram-bot-status">
            <div class="bot-name">name: ${this.personality.telegramBot.name}</div>
            <div class="bot-username">username: @${this.personality.telegramBot.username}</div>
            </div>`
        }
    }
    afterRender(){
        if(this.personality.telegramBot.id){
            let telegramBotInput = this.element.querySelector("#botId");
            telegramBotInput.value = this.personality.telegramBot.id;
        }
    }
    async startTelegramBot(targetElement){
        let botIdInput = this.element.querySelector("#botId");
        let botId = botIdInput.value;
        if(!botId){
            alert("Please provide a bot id");
            return;
        }
        try {
            await spaceModule.startTelegramBot(assistOS.space.id, this.personality.id, botId);
        } catch (e) {
            assistOS.showToast(e.message, "fail");
        }
        let personality = await personalityModule.getPersonality(assistOS.space.id, this.personality.id);
        this.personalityPagePresenter.initialPersonality.telegramBot = personality.telegramBot;
        this.personality.telegramBot = personality.telegramBot;
        this.invalidate();
    }
}