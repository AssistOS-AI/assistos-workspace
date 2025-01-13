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

    async afterRender() {
        this.sidebar = this.element.querySelector(".right-sidebar");
        this.currentPage = this.element.querySelector(".current-page");
        this.agentPage = this.element.querySelector("agent-page");
        this.highlightSidebarItem();
    }

    async toggleChat(_target, mode, width) {
        function throttle(func, limit) {
            let lastFunc;
            let lastRan;
            return function (...args) {
                const context = this;
                if (!lastRan) {
                    func.apply(context, args);
                    lastRan = Date.now();
                } else {
                    clearTimeout(lastFunc);
                    lastFunc = setTimeout(function () {
                        if ((Date.now() - lastRan) >= limit) {
                            func.apply(context, args);
                            lastRan = Date.now();
                        }
                    }, limit - (Date.now() - lastRan));
                }
            }
        }

        function dragStartHandler(event) {
            function resizePanels(startDragX, agentPageInitialWidth, currentPageInitialWidth, event) {
                let mouseX = event.clientX;

                let agentPageWidth = agentPageInitialWidth + (mouseX - startDragX);
                let currentPageWidth = currentPageInitialWidth - (mouseX - startDragX);

                let spaceApplicationPage = document.querySelector('space-application-page');
                let minimumChatWidth = 0.1 * parseFloat(getComputedStyle(spaceApplicationPage).width)

                if (agentPageWidth >= minimumChatWidth - 30) {
                    this.agentPage.style.width = agentPageWidth + 'px';
                    this.currentPage.style.width = currentPageWidth + 'px';
                    this.agentPageWidth = agentPageWidth;
                    this.currentPageWidth = currentPageWidth;
                    assistOS.UI.chatWidth = agentPageWidth;
                } else {
                    this.boundMouseUp();
                    this.toggleChat(undefined);

                }
            }

            function stopResize() {
                this.element.removeEventListener('mousemove', this.boundMouseMoveFn);
                document.removeEventListener('mouseup', this.boundMouseUp);
                document.body.style.userSelect = "initial";
            }

            document.body.style.userSelect = "none";
            let startDragX = event.clientX;

            let agentPageWidth = parseFloat(getComputedStyle(this.agentPage, null).width);
            let currentPageWidth = parseFloat(getComputedStyle(this.currentPage, null).width);

            if (!this.boundMouseMoveFn) {
                this.boundMouseMoveFn = throttle(resizePanels.bind(this, startDragX, agentPageWidth, currentPageWidth), 150);
            }

            if (!this.boundMouseUp) {
                this.boundMouseUp = stopResize.bind(this);
            }

            this.element.addEventListener("mousemove", this.boundMouseMoveFn);

            document.addEventListener("mouseup", this.boundMouseUp, {once: true});

        }

        const addDragListener = () => {
            let resizeBar = this.element.querySelector('.drag-separator');
            this.boundStartDrag = dragStartHandler.bind(this);
            resizeBar.addEventListener("mousedown", this.boundStartDrag);
        }
        const removeDragListener = () => {
            let resizeBar = this.element.querySelector('.drag-separator');
            resizeBar.removeEventListener("mousedown", this.boundStartDrag);
            delete this.boundStartDrag;
        }

        const maximizeChat = () => {
            arrow.classList.toggle("arrow-rotated");
            assistOS.UI.chatState = "open";
            let spaceApplicationPage = document.querySelector('space-application-page');
            let minimumChatWidth = 0.1 * parseFloat(getComputedStyle(spaceApplicationPage).width)
            agentPage.style.display = "flex";
            agentPage.style.minWidth = minimumChatWidth + 'px';
            agentPage.style.width = (width || assistOS.UI.chatWidth || minimumChatWidth) + 'px';
            assistOS.UI.chatWidth = width || minimumChatWidth;
            addDragListener();
        }
        const minimizeChat = () => {
            arrow.classList.toggle("arrow-rotated");
            assistOS.UI.chatState = "close";
            assistOS.UI.chatWidth = 0;
            agentPage.style.display = "none";
            agentPage.style.width = "0px";
            agentPage.style.minWidth = "0px";
            removeDragListener();
        }

        const arrow = document.querySelector("#point-arrow-chat");
        const agentPage = document.querySelector("agent-page");
        if (mode === "open") {
            maximizeChat();
        } else if (mode === "close") {
            minimizeChat();
        } else {
            if (assistOS.UI.chatState === "open") {
                minimizeChat();
            } else {
                maximizeChat();
            }
        }
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
