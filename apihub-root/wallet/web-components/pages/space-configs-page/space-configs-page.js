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
        await assistOS.UI.changeToDynamicPage("space-configs-page", `${assistOS.space.id}/SpaceConfiguration/${page}`);
    }

    toggleSidebar(_target, mode){
        let arrow = _target.querySelector(".point-arrow");
        if(mode === "off"){
            this.sidebar.style.transform = "translateX(95%)";
            this.currentPageWidth = this.currentPageWidth + 270;
            this.currentPage.style.width = this.currentPageWidth ? `${this.currentPageWidth}px` : "calc(50% + 135px)";
            _target.setAttribute("data-local-action", "toggleSidebar on");
            arrow.classList.toggle("arrow-rotated");
            this.dispatchSidebarEvent("hideSidebar");
        } else {
            if(this.agentPageWidth > this.currentPageWidth){
                this.agentPageWidth = this.agentPageWidth - 270;
                this.agentPage.style.width = this.agentPageWidth ? `${this.agentPageWidth}px` : "calc(50% - 135px)";
            } else {
                this.currentPageWidth = this.currentPageWidth - 270;
                this.currentPage.style.width = this.currentPageWidth ? `${this.currentPageWidth}px` : "calc(50% - 135px)";
            }
            this.sidebar.style.transform = "translateX(0%)";
            _target.setAttribute("data-local-action", "toggleSidebar off");
            arrow.classList.toggle("arrow-rotated");
            this.dispatchSidebarEvent("showSidebar");
        }
    }

    dispatchSidebarEvent(name){
        let hideSidebar = new Event(name, {
            bubbles: true,
            cancelable: true
        });
        this.currentPage.dispatchEvent(hideSidebar);
    }
}