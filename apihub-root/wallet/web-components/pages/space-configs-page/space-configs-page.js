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

        if(this.firstNewWidth){
            this.agentPage.style.width = this.firstNewWidth + 'px';
            this.currentPage.style.width = this.secondNewWidth + 'px';
        }
    }
    resizePanels(startX, firstPanelWidth, secondPanelWidth, event) {
        if (this.isResizing) {
            let mouseX = event.clientX;
            this.firstNewWidth = firstPanelWidth + (mouseX - startX);
            this.secondNewWidth = secondPanelWidth - (mouseX - startX);
            let minimumSize = 350;
            if(this.firstNewWidth > minimumSize && this.secondNewWidth > minimumSize){
                this.agentPage.style.width = this.firstNewWidth + 'px';
                this.currentPage.style.width = this.secondNewWidth + 'px';
            }
            if(this.secondNewWidth < minimumSize){
                this.secondNewWidth = minimumSize;
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
        this.currentPage.style.width = this.secondNewWidth ? `calc(${this.secondNewWidth}px + 270px)` : "calc((100% + 270px) / 2)";
        this.dispatchSidebarEvent("hideSidebar");
    }
    showSidebar(){
        this.sidebar.style.transform = "translateX(0%)";
        this.expandButton.style.display = "none";
        this.currentPage.style.width = this.secondNewWidth ? `${this.secondNewWidth}px` : "calc((100% - 270px) / 2)";
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