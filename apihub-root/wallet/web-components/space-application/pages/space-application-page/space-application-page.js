export class SpaceApplicationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.configPage = location.hash.split("/")[2] || "announcements-page";
        this.invalidate();
    }

    beforeRender() {
        if (assistOS.UI.sidebarState === "closed") {
            this.transformStyle = "transform:translateX(80%);";
            this.arrowRotationToggle = "arrow-rotated"
        } else {
            this.transformStyle = "transform:translateX(0%);";
            this.arrowRotationToggle = ""
        }
    }

    highlightSidebarItem() {
        let sidebarItems = this.element.querySelectorAll(".sidebar-item");
        sidebarItems.forEach((item) => {
            if (item.getAttribute("data-local-action").split(" ")[1] === this.currentPage.componentName) {
                item.classList.add("highlighted");
            }
        });
    }

    afterRender() {
        this.sidebar = this.element.querySelector(".right-sidebar");
        this.currentPage = this.element.querySelector(".current-page");
        this.agentPage = this.element.querySelector("agent-page");
        let resizeBar = this.element.querySelector('.drag-separator');
        this.isResizing = false;
        this.highlightSidebarItem();
        if (!this.boundMouseDownFn) {
            this.boundMouseDownFn = this.MouseDownFn.bind(this);
            resizeBar.addEventListener("mousedown", this.boundMouseDownFn);
        }

        if (this.agentPageWidth) {
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
            let minimumSizeAgent = 0;
            if (firstNewWidth >= minimumSizeAgent && secondNewWidth >= minimumSize) {
                this.agentPage.style.width = firstNewWidth + 'px';
                this.currentPage.style.width = secondNewWidth + 'px';
                this.agentPageWidth = firstNewWidth;
                this.currentPageWidth = secondNewWidth;
            }
            if(this.agentPageWidth < 350){
                let chatControls = this.element.querySelector(".space-controls");
                chatControls.style.display = "none";
            } else {
                let chatControls = this.element.querySelector(".space-controls");
                chatControls.style.display = "flex";
            }
            if(this.agentPageWidth < 20){
                let chatContainer = this.element.querySelector(".chat-input-container");
                chatContainer.style.zIndex = -1;
                this.agentPage.style.width = 0 + 'px';
                this.agentPageWidth = 0;
            } else {
                let chatContainer = this.element.querySelector(".chat-input-container");
                chatContainer.style.zIndex = "initial";
            }
        }
    }

    stopResize() {
        this.isResizing = false;
        this.element.removeEventListener('mousemove', this.resizePanels);
        document.body.style.userSelect = "initial";
    }

    MouseDownFn(event) {
        document.body.style.userSelect = "none";
        this.isResizing = true;
        let startX = event.clientX;
        let firstPanelWidth = parseFloat(getComputedStyle(this.agentPage, null).width);
        let secondPanelWidth = parseFloat(getComputedStyle(this.currentPage, null).width);

        if (!this.boundMouseMoveFn) {
            this.boundMouseMoveFn = this.resizePanels.bind(this, startX, firstPanelWidth, secondPanelWidth);
            this.element.addEventListener("mousemove", this.boundMouseMoveFn);
        }

        if (!this.boundMouseUp) {
            this.boundMouseUp = this.stopResize.bind(this);
        }
        document.addEventListener("mouseup", this.boundMouseUp, {once: true});

    }

    async navigateToPage(_target, page) {
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/${page}`);
    }

    dispatchSidebarEvent(name) {
        let hideSidebar = new Event(name, {
            bubbles: true,
            cancelable: true
        });
        this.currentPage.dispatchEvent(hideSidebar);
    }
}
