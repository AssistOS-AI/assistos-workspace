export class SpaceApplicationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.configPage = location.hash.split("/")[2] || "documents-page";
        this.invalidate();
    }

    async beforeRender() {
        //const chatId = assistOS.agent.agentData.selectedChat || assistOS.agent.agentData.chats[0];
        //this.chatPage = `<chat-page data-chatId="${chatId}" data-personalityId="${assistOS.agent.agentData.id}" data-spaceId="${assistOS.space.id}" data-userId="${assistOS.user.id}" data-presenter="chat-page" tabindex="0"></chat-page>`
    }

    async afterRender() {
        this.sidebar = this.element.querySelector(".right-sidebar");
        this.currentPage = this.element.querySelector(".current-page");
        this.spacePageContainer = this.element.querySelector("#space-page-container");
        this.highlightSidebarItem();
    }

    highlightSidebarItem() {
        let sidebarItems = this.element.querySelectorAll(".sidebar-item");
        sidebarItems.forEach((item) => {
            if (item.getAttribute("data-local-action").split(" ")[1] === this.currentPage.componentName) {
                item.classList.add("highlighted");
            }
        });
    }

    async changePage(pageName) {
        this.spacePageContainer.innerHTML = `<${pageName} data-presenter="${pageName}"></${pageName}>`;
    }


    dispatchSidebarEvent(name) {
        let hideSidebar = new Event(name, {
            bubbles: true,
            cancelable: true
        });
        this.currentPage.dispatchEvent(hideSidebar);
    }
}
