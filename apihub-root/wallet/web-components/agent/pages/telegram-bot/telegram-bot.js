const spaceModule = AssistOS.loadModule("space", {});
const agentModule = AssistOS.loadModule("agent", {});

export class TelegramBot {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate();
    }
    async beforeRender() {
        let usersHTML = "no users added";
        if (this.agent.telegramBot.id) {
            this.telegramBotStatus = `<div class="telegram-bot-status">
            <div class="bot-name">
                <div class="label">name:</div>
                <div>${this.agent.telegramBot.name}</div>
            </div>
            <div class="bot-username">
                <div class="label">username:</div>
                <div>@${this.agent.telegramBot.username}</div>
            </div>
            </div>`;
            // <div class="bot-public">
            //     <label class="label">public chat:</label>
            //     <input type="checkbox" class="public-checkbox" ${this.agent.telegramBot.public ? "checked" : ""}>
            // </div>
            usersHTML = "";
            for (let user of this.agent.telegramBot.users) {
                usersHTML += `
            <div class="user">
                <div class="user-first-name">${user.firstName}</div>
                <div class="user-last-name">${user.lastName}</div>
                <div class="document-link" data-local-action="openDocument ${user.chatId}">View chat history</div>
                <img src="/wallet/assets/icons/trash-can.svg" class="delete-user black-icon pointer" data-local-action="removeUser ${user.id}" alt="trash">
            </div>`
            }
        }
        this.usersHTML = usersHTML;
    }
    afterRender() {
        if (this.agent.telegramBot.id) {
            let telegramBotInput = this.element.querySelector("#botId");
            telegramBotInput.value = this.agent.telegramBot.id;
            let usersTable = this.element.querySelector(".users-table");
            usersTable.classList.remove("hidden");
            // let checkbox = this.element.querySelector(".public-checkbox");
            // checkbox.addEventListener("change", async (e) => {
            //     this.agent.telegramBot.public = e.target.checked;
            //     await agentModule.updateAgent(assistOS.space.id, this.agent.id, this.agent);
            // });
        }
    }
    async startTelegramBot(targetElement) {
        targetElement.classList.add("loading-icon");
        targetElement.disabled = true;
        targetElement.innerHTML = "";
        let botIdInput = this.element.querySelector("#botId");
        let botId = botIdInput.value;
        if (!botId) {
            alert("Please provide a bot id");
            return;
        }
        try {
            await spaceModule.startTelegramBot(assistOS.space.id, this.agent.id, botId);
            assistOS.showToast("Bot Started", "success");
        } catch (e) {
            assistOS.showToast(e.message, "fail");
        } finally {
            targetElement.classList.remove("loading-icon");
            targetElement.disabled = false;
            targetElement.innerHTML = "Start Bot";
        }
        let agent = await agentModule.getAgent(assistOS.space.id, this.agent.id);
        this.agentPagePresenter.initialAgent.telegramBot = agent.telegramBot;
        this.agent.telegramBot = agent.telegramBot;
        this.invalidate();
    }
    async removeUser(targetElement, userId) {
        let message = "Are you sure you want to remove this user's access to this bot?";
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", { message }, true);
        if (!confirmation) {
            return;
        }
        await spaceModule.removeTelegramUser(assistOS.space.id, this.agent.id, userId);
        let agent = await agentModule.getAgent(assistOS.space.id, this.agent.id);
        this.agentPagePresenter.initialAgent.telegramBot = agent.telegramBot;
        this.agent.telegramBot = agent.telegramBot;
        this.invalidate();
    }
    async openDocument(targetElement, documentId) {
        await assistOS.UI.changeToDynamicPage(`space-application-page`, `${assistOS.space.id}/Space/document-view-page/${documentId}`);
    }
}