export class SpaceConfigsPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.configPage = location.hash.split("/")[2] || "announcements-page";
        this.invalidate();
    }

    beforeRender() {
    }

    afterRender() {
        this.sidebar = this.element.querySelector(".right-sidebar");
        this.expandButton = this.element.querySelector(".expand-button");
        this.expandButton.style.display = "none";
        this.currentPage = this.element.querySelector(".current-page");
    }

    async navigateToPage(_target, page){
        await webSkel.changeToDynamicPage("space-configs-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/${page}`);
    }

    hideSidebar(){
        this.sidebar.style.transform = "translateX(100%)";
        this.expandButton.style.display = "block";
        this.currentPage.style.width = "calc((100% + 270px) / 2)";
        this.dispatchSidebarEvent("hideSidebar");
    }
    showSidebar(){
        this.sidebar.style.transform = "translateX(0%)";
        this.expandButton.style.display = "none";
        this.currentPage.style.width = "calc((100% - 270px) / 2)";
        this.dispatchSidebarEvent("showSidebar");
    }

    dispatchSidebarEvent(name){
        let hideSidebar = new Event(name, {
            bubbles: true,
            cancelable: true
        });
        this.currentPage.dispatchEvent(hideSidebar);
    }
}