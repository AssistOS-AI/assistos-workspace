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
                    <img class="pointer" src="./wallet/assets/icons/edit-document.svg" data-local-action="editChatScript ${script.id}" alt="edit">
                    <img class="pointer" src="./wallet/assets/icons/trash-can.svg" data-local-action="deleteChatScript ${script.id}" alt="delete">
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