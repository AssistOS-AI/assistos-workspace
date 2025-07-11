const chatModule = assistOS.loadModule("chat");

export class ChatScriptsPage {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.chatScripts = await chatModule.getChatScripts(assistOS.space.id);
        this.scriptRows = this.chatScripts.map(script => `
            <tr>
                <td class="main-cell">
                    <span style="font-weight: 500;">${script.name}</span>
                </td>
                <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${script.description}
                </td>
                <td class="actions-button">
                    <button class="table-action-btn" data-local-action="editChatScript ${script.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="delete-row-btn" data-local-action="deleteChatScript ${script.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async afterRender() {

    }

    async openAddChatScriptsModal() {
        const refreshComponent = await assistOS.UI.showModal("add-edit-chat-script", true);
        if (refreshComponent) {
            this.invalidate();
        }
    }

    async editChatScript(event, scriptId) {
        const refreshComponent = await assistOS.UI.showModal("add-edit-chat-script", {
            "script-id": scriptId
        }, true);
        if (refreshComponent) {
            this.invalidate();
        }
    }

    async deleteChatScript(event, processId) {
        let message = `Are you sure you want to delete this chat script? This action cannot be undone.`;

       let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
       if(confirmation){
            try {
                await chatModule.deleteChatScript(assistOS.space.id, processId);
                assistOS.showToast("Script deleted successfully!", "success");
                this.invalidate();
            } catch (error) {
                console.error("Error deleting chat script:", error);
                assistOS.showToast("Error deleting chat script:", "error");
            }
       }
    }
}