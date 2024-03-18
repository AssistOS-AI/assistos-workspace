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

        if(this.agentPageWidth){
            this.agentPage.style.width = this.agentPageWidth + 'px';
            this.currentPage.style.width = this.currentPageWidth + 'px';
        }
    }
    resizePanels(startX, firstPanelWidth, secondPanelWidth, event) {
        if (this.isResizing) {
            let mouseX = event.clientX;
            let firstNewWidth = firstPanelWidth + (mouseX - startX);
            let secondNewWidth = secondPanelWidth - (mouseX - startX);
            let minimumSize = 350;
            if(firstNewWidth >= minimumSize && secondNewWidth >= minimumSize){
                this.agentPage.style.width = firstNewWidth + 'px';
                this.currentPage.style.width = secondNewWidth + 'px';
                this.agentPageWidth = firstNewWidth;
                this.currentPageWidth = secondNewWidth;
            }
        }
    }

    stopResize() {
        this.isResizing = false;
        this.element.removeEventListener('mousemove', this.resizePanels);
        document.body.style.userSelect = "initial";
    }
    MouseDownFn(event){
        document.body.style.userSelect = "none";
        this.isResizing = true;
        let startX = event.clientX;
        let firstPanelWidth = parseFloat(getComputedStyle(this.agentPage, null).width);
        let secondPanelWidth = parseFloat(getComputedStyle(this.currentPage, null).width);
        if(this.boundMouseMoveFn){
            this.element.removeEventListener("mousemove", this.boundMouseMoveFn);
        }
        this.boundMouseMoveFn = this.resizePanels.bind(this, startX, firstPanelWidth, secondPanelWidth);
        this.element.addEventListener("mousemove", this.boundMouseMoveFn);

        if(this.boundMouseUp){
            this.element.removeEventListener("mouseup", this.boundMouseUp);
        }
        this.boundMouseUp = this.stopResize.bind(this);
        this.element.addEventListener("mouseup", this.boundMouseUp);
    }

    async navigateToPage(_target, page){
        await webSkel.changeToDynamicPage("space-configs-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/${page}`);
    }

    hideSidebar(){
        this.sidebar.style.transform = "translateX(100%)";
        this.expandButton.style.display = "block";
        this.currentPageWidth = this.currentPageWidth + 270;
        this.currentPage.style.width = this.currentPageWidth ? `${this.currentPageWidth}px` : "calc(50% + 135px)";
        this.dispatchSidebarEvent("hideSidebar");
    }
    showSidebar(){
        if(this.agentPageWidth > this.currentPageWidth){
            this.agentPageWidth = this.agentPageWidth - 270;
            this.agentPage.style.width = this.agentPageWidth ? `${this.agentPageWidth}px` : "calc(50% - 135px)";
        } else {
            this.currentPageWidth = this.currentPageWidth - 270;
            this.currentPage.style.width = this.currentPageWidth ? `${this.currentPageWidth}px` : "calc(50% - 135px)";
        }
        this.sidebar.style.transform = "translateX(0%)";
        this.expandButton.style.display = "none";
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