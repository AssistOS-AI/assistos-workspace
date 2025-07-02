export class SpaceApplicationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentPage = location.hash.split("/")[2] || "documents-page";
        this.invalidate();
    }

    async beforeRender() {
        //this.chatPage = `<chat-page data-chatId="${chatId}" data-personalityId="${assistOS.agent.id}" data-spaceId="${assistOS.space.id}" data-userId="${assistOS.user.email}" data-presenter="chat-page" tabindex="0"></chat-page>`
    }

    async afterRender() {
        this.sidebar = this.element.querySelector(".right-sidebar");
        this.currentPage = this.element.querySelector(".current-page");
        this.spacePageContainer = this.element.querySelector("#space-page-container");
    }

    async changePage(pageName) {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/${pageName}`);
    }


    dispatchSidebarEvent(name) {
        let hideSidebar = new Event(name, {
            bubbles: true,
            cancelable: true
        });
        this.currentPage.dispatchEvent(hideSidebar);
    }
}
