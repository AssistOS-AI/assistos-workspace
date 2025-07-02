const agentModule = assistOS.loadModule("agent");
const chatModule = assistOS.loadModule("chat");

export class ChatsPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.spaceId = assistOS.space.id;
        this.invalidate();
    }

    async beforeRender() {
        this.chats = await chatModule.getChats(this.spaceId);
        this.chatRows = this.chats.map(chat => `
            <tr>
                <td class="main-cell">${chat.docId}</td>
                <td>Chat Process</td>
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
        this.executionHistory = this.getExecutionHistory();
    }


    getExecutionHistory() {
            return this.chatHistory||[].map(item => `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-chat-name">${item.chatName}</span>
                    </div>
                </div>
            `).join('');

    }

    async afterRender() {

    }

    async showAddChatModal() {
        const result = await assistOS.UI.showModal("add-chat-modal-extended", true);
        if (result.addedChat) {
            this.invalidate();
        }
    }

    async editChat(event, chatid) {
        const result = await assistOS.UI.showModal("edit-chat-modal", {
            chatid
        }, true);

        if (result.editedChat) {
                this.invalidate();
            }
    }
    async deleteChat(event, chatid) {
        const result = await assistOS.UI.showModal("delete-chat-modal", {
            chatid
        }, true);
        if (result.chatDeleted) {
            this.invalidate();
        }
    }
    async runChat(event, chatId) {
        this.invalidate();
    }



}