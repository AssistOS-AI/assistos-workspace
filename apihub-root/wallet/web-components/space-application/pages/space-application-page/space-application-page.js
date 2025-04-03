export class SpaceApplicationPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.configPage = location.hash.split("/")[2] || "announcements-page";
        this.invalidate();
    }

    async beforeRender() {
        if (assistOS.UI.sidebarState === "closed") {
            this.transformStyle = "transform:translateX(80%);";
            this.arrowRotationToggle = "arrow-rotated"
        } else {
            this.transformStyle = "transform:translateX(0%);";
            this.arrowRotationToggle = ""
        }

    }

    async afterRender() {
        this.sidebar = this.element.querySelector(".right-sidebar");
        this.currentPage = this.element.querySelector(".current-page");
        this.agentPage = this.element.querySelector("chat-container");
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

    async toggleFullScreen(_target) {
        if(assistOS.UI.chatState === "fullscreen") {
            await this.toggleChat(undefined,"open",assistOS.UI.chatWidth);
        }else{
            const arrow = this.element.querySelector("#point-arrow-chat");
            const agentPage = this.element.querySelector("chat-container");
            arrow.classList.add("arrow-rotated");
            assistOS.UI.chatState = "fullscreen";
            agentPage.style.display = "flex";
            agentPage.style.width = "calc(100vw - 70px - 42px - 36px)";
            agentPage.style.minWidth = "calc(100vw - 70px - 42px - 36px)";
        }
    }

    async toggleChat(_target, mode, width) {
        const maximizeChat = () => {
            arrow.classList.add("arrow-rotated");
            assistOS.UI.chatState = "open";
            let spaceApplicationPage = document.querySelector('space-application-page');
            let minimumChatWidth = 0.35 * parseFloat(getComputedStyle(spaceApplicationPage).width);
            agentPage.style.display = "flex";
            agentPage.style.minWidth = minimumChatWidth + 'px';
            agentPage.style.width = (width || assistOS.UI.chatWidth || minimumChatWidth) + 'px';
            assistOS.UI.chatWidth = width || assistOS.UI.chatWidth || minimumChatWidth;
            if(!this.boundStartDrag){
                addDragListener();
            }
            document.cookie=`chatState=open;path=/;max-age=31536000;`;
        }

        const minimizeChat = () => {
            arrow.classList.remove("arrow-rotated");
            assistOS.UI.chatState = "close";
            agentPage.style.display = "none";
            agentPage.style.width = "0px";
            agentPage.style.minWidth = "0px";
            removeDragListener();
            document.cookie=`chatState=close;path=/;max-age=31536000;`;
        }

        function dragStartHandler(event) {
            const dragThreshold = 30;
            let isDragging = false;
            const startDragX = event.clientX;
            const agentPageInitialWidth = parseFloat(getComputedStyle(agentPage).width);
            let lastDeltaX = 0;

            const onMouseMove = (event) => {
                let mouseX = event.clientX;
                let deltaX = mouseX - startDragX;
                if (!isDragging && Math.abs(deltaX) > dragThreshold) {
                    isDragging = true;
                }
                if (!isDragging) {
                    return;
                }
                let agentPageWidth = agentPageInitialWidth + deltaX;
                let spaceApplicationPage = document.querySelector('space-application-page');
                let minimumChatWidth = 0.35 * parseFloat(getComputedStyle(spaceApplicationPage).width);
                if (agentPageWidth >= minimumChatWidth) {
                    agentPage.style.width = agentPageWidth + 'px';
                    assistOS.UI.chatWidth = agentPageWidth;
                } else {
                    minimizeChat();
                }
                lastDeltaX = deltaX;
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                document.body.style.userSelect = "initial";
                if (isDragging && lastDeltaX !== 0) {
                }
            };

            document.body.style.userSelect = "none";
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp, { once: true });
        }

        const addDragListener = () => {
            let resizeBar = this.element.querySelector('.drag-separator');
            this.boundStartDrag = dragStartHandler.bind(this);
            resizeBar.addEventListener("mousedown", this.boundStartDrag);
        }

        const removeDragListener = () => {
            let resizeBar = this.element.querySelector('.drag-separator');
            if (this.boundStartDrag) {
                resizeBar.removeEventListener("mousedown", this.boundStartDrag);
                this.boundStartDrag = null;
            }
        }

        const arrow = this.element.querySelector("#point-arrow-chat");
        const agentPage = this.element.querySelector("chat-container");

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
