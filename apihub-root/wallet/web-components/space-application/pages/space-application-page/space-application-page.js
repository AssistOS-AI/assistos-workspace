export class SpaceApplicationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentPage = location.hash.split("/")[2] || "documents-page";
        this.invalidate();
    }

    async beforeRender() {
        this.chatPage = `<chat-page data-chatId="${assistOS.space.currentChatId}" data-agent-name="${assistOS.agent.name}" data-spaceId="${assistOS.space.id}" data-userId="${assistOS.user.email}" data-presenter="chat-page" tabindex="0"></chat-page>`
    }

    async afterRender() {
    }

    async changePage(pageName) {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/${pageName}`);
    }
}
