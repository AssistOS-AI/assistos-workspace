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
        this.agentPage = this.element.querySelector("agent-page");
        let resizeBar = this.element.querySelector('.drag-separator');
        this.isResizing = false;

        if(this.boundMouseDownFn){
            resizeBar.removeEventListener("mousedown", this.boundMouseDownFn);
        }
        this.boundMouseDownFn = this.MouseDownFn.bind(this);
        resizeBar.addEventListener("mousedown", this.boundMouseDownFn);
    }
    resizePanels(event) {
        if (this.isResizing) {
            let panel1Width = event.clientX;
            this.currentPage.style.width = panel1Width + 'px';
            this.agentPage.style.width = 'calc(100% - ' + panel1Width + 'px)';
        }
    }

    stopResize() {
        this.isResizing = false;
        this.removeEventListener('mousemove', this.resizePanels);
    }
    MouseDownFn(){
        this.isResizing = true;
        this.element.addEventListener('mousemove', this.resizePanels);
        this.element.addEventListener('mouseup', this.stopResize);
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