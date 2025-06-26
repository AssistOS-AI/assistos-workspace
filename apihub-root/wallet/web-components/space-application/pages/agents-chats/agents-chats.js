export class AgentsChats {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.parentPage = this.element.closest('edit-agent-page').webSkelPresenter;
        this.invalidate();
    }

    async beforeRender() {
        const chats = this.parentPage.chats || [];
        const executionHistory = this.parentPage.executionHistory || [];
        const selectedChatId = this.parentPage.selectedChatId;

        this.chatRows = chats.map(chat => `
            <tr>
                <td class="main-cell">${chat.name}</td>
                <td>${chat.processName}</td>
                <td>${chat.lastRun}</td>
                <td>
                    <span class="${this.parentPage.getStatusBadgeClass(chat.status)}">
                        ${this.parentPage.formatStatus(chat.status)}
                    </span>
                </td>
                <td class="actions-button">
                    <button class="table-action-btn" data-local-action="editChat ${chat.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="table-action-btn run-btn" data-local-action="runChat ${chat.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="delete-row-btn" data-local-action="deleteChat ${chat.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');

        if (selectedChatId) {
            const chatHistory = executionHistory.filter(h => h.chatId === selectedChatId);
            this.executionHistory = chatHistory.map(item => `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-chat-name">${item.chatName}</span>
                        <span class="history-timestamp">${item.timestamp}</span>
                    </div>
                    <div class="history-details">
                        Duration: ${item.duration}
                        <span class="${this.parentPage.getStatusBadgeClass(item.status)} history-status">
                            ${this.parentPage.formatStatus(item.status)}
                        </span>
                    </div>
                    <div class="history-details">
                        Result: ${item.result}
                    </div>
                </div>
            `).join('');
            this.historyDisplay = "";
        } else {
            this.executionHistory = `<div style="text-align: center; color: #666; padding: 40px;">
                Select a chat and click "Run" to see execution history
            </div>`;
            this.historyDisplay = "display: none;";
        }
    }

    async afterRender() {
    }

    async showAddChatModal() {
        await this.parentPage.showAddChatModal();
    }

    async editChat(event, chatId) {
        await this.parentPage.editChat(event, chatId);
    }

    async runChat(event, chatId) {
        await this.parentPage.runChat(event, chatId);
    }

    async deleteChat(event, chatId) {
        await this.parentPage.deleteChat(event, chatId);
    }
}