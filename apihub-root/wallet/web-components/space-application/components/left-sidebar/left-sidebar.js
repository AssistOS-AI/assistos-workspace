import {changeSelectedPageFromSidebar, generateAvatar} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const userModule = require("assistos").loadModule("user", {});
export class LeftSidebar {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.themeIcon = "wallet/assets/icons/moon.svg";
        this.tasksHandlers = {};
        this.boundShowTaskNotification = this.showTaskNotification.bind(this);

        let currentTheme = localStorage.getItem('theme');
        if (currentTheme && currentTheme === 'dark') {
            this.themeIcon = "wallet/assets/icons/sun.svg";
        } else {
            this.themeIcon = "wallet/assets/icons/moon.svg";
        }
        this.invalidate(async ()=>{
            //this.tasks = await utilModule.getTasks(assistOS.space.id);
            this.tasks = []
            await assistOS.NotificationRouter.subscribeToSpace(assistOS.space.id, "sidebar-tasks", this.boundShowTaskNotification);
        });
    }
    async beforeRender() {
        this.applications = "";
        let userImageURL = "./wallet/assets/images/defaultUserPhoto.png";
        if(assistOS.user.imageId){
            userImageURL = await spaceModule.getImageURL(assistOS.user.imageId);
        }
        let img = new Image();
        img.onerror = async () => {
            let uint8Array = await generateAvatar(assistOS.user.email);
            assistOS.user.imageId = await spaceModule.putImage(uint8Array);
            await userModule.updateUserImage(assistOS.user.email, assistOS.user.imageId);
        };
        img.src = userImageURL;
        img.onload = () => {
            img.remove();
        };
        this.userImage = userImageURL;
        this.userName = assistOS.user.name;
        for (let application of assistOS.space.applications) {
            let svgImage = application.svg;

            this.applications += `
        <div class="feature" data-id="${application.name.toLowerCase()}" data-local-action="startApplication ${application.id}">
            <div class="app-focus hidden"></div>
            <div class="page-logo">
                ${svgImage}
                <div class="app-name" id="${application.name.toLowerCase()}">
                    ${application.name}
                </div>
            </div>
        </div>`;
        }
        let stringHTML = "";
        let spaces = await userModule.listUserSpaces(assistOS.user.email);
        for(let space of spaces){
            stringHTML += `<list-item data-local-action="swapSpace ${space.id}" data-name="${space.name}" data-highlight="dark-highlight"></list-item>`;
        }
        this.spaces = stringHTML;
    }
    afterRender() {
        this.toastsContainer = this.element.querySelector(".toasts-container");
        let features = this.element.querySelectorAll(".feature");
        features.forEach((feature) => {
            let timeoutId;
            if(feature.getAttribute("data-id") === "space"){
                let focusSection = feature.querySelector("#space");
                feature.addEventListener("mouseover", () => {
                    focusSection.style.visibility = "visible";
                    let currentSpace = focusSection.querySelector(`[data-name="${assistOS.space.name}"]`);
                    if(currentSpace) {
                        currentSpace.style.backgroundColor = "var(--black)";
                    }

                });
                feature.addEventListener("mouseout", () => {
                    focusSection.style.visibility = "hidden";
                });
                focusSection.addEventListener("mouseout", (event) => {
                    if(!focusSection.contains(event.relatedTarget)){
                        focusSection.style.visibility = "hidden";
                    }
                });
            } else{
                feature.addEventListener("mouseover", () => {
                    timeoutId = setTimeout(() => {
                        let name = feature.querySelector(`[id=${feature.getAttribute("data-id")}]`);
                        name.style.visibility = "visible";
                    }, 300);
                });
                feature.addEventListener("mouseout", () => {
                    clearTimeout(timeoutId);
                    let name = feature.querySelector(`[id=${feature.getAttribute("data-id")}]`);
                    name.style.visibility = "hidden";
                });
            }
        });

        let clock = this.element.querySelector(".clock");

        function updateClock() {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            clock.innerText = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
        }

        updateClock();
        setInterval(updateClock, 10000);
        changeSelectedPageFromSidebar(window.location.hash);
    }
    showNotificationToast(message, downloadURL, fileName) {
        this.toastsContainer.insertAdjacentHTML("beforeend",
            `<notification-toast data-message="${message}" data-url="${downloadURL || ""}" data-file-name="${encodeURIComponent(fileName) || ""}" data-presenter="notification-toast"></notification-toast>`);
    }
    async navigateToPage(_target, page) {
        assistOS.navigateToPage(page);
    }

   toggleChat(_target, mode) {
        const chatPage = document.querySelector("chat-page");
        let chatPresenter = chatPage.webSkelPresenter;
        let chatState = localStorage.getItem("chatState");
        if (chatState !== "minimized") {
            chatPresenter.toggleMinimizeScreen();
        } else {
            chatPresenter.toggleHalfScreen();
        }
    }

    showTaskNotification(data) {
        if(data.name === "DocumentToVideo"){
           this.handleDocumentToVideoTask(data);
        } else if(data.name === "ExportDocument"){
            this.handleExportDocumentTask(data);
        }
    }
    handleDocumentToVideoTask(task) {
        if(task.status === "completed"){
            this.showNotificationToast(`Task ${task.name} has been completed`, task.result, "video.mp4");
        } else if(task.status === "failed"){
            this.showNotificationToast(`Task ${task.name} has failed`);
        }
    }
    handleExportDocumentTask(task){
        if(task.status === "completed"){
            this.showNotificationToast(`Task ${task.name} has been completed`, task.result, "document.docai");
        } else if(task.status === "failed"){
            this.showNotificationToast(`Task ${task.name} has failed`);
        }
    }

    async startApplication(_target, appName) {
        await assistOS.startApplication(appName);
        changeSelectedPageFromSidebar(window.location.hash);
    }

    toggleTheme(_target) {
        const element = document.getElementsByTagName('html')[0];
        const currentTheme = element.getAttribute('theme');
        if (currentTheme && currentTheme === 'dark') {
            element.setAttribute('theme', '');
            this.themeIcon = "wallet/assets/icons/moon.svg";
            this.invalidate();
        } else {
            element.setAttribute('theme', 'dark');
            this.themeIcon = "wallet/assets/icons/sun.svg";
            this.invalidate();
        }
        localStorage.setItem('theme', element.getAttribute('theme'));
    }

    changeBaseURL(newBaseURL) {
        document.getElementById('baseTag').setAttribute('href', newBaseURL);
    }
    async openAccountSettings() {
        function hideDropdown() {
            dropdownMenu.style.display = "none";
            userPhotoContainer.removeEventListener('mouseleave', hideDropdown);
        }

        let userPhotoContainer = this.element.querySelector(".user-photo-container");
        let dropdownMenu = this.element.querySelector(".user-action-menu");
        hideDropdown();
        await assistOS.UI.changeToDynamicPage("space-application-page", `${assistOS.space.id}/Space/account-settings-page`);
    }
    openUserActions(_target) {
        let userPhotoContainer = this.element.querySelector(".user-photo-container");
        let dropdownMenu = this.element.querySelector(".user-action-menu");

        dropdownMenu.style.display = "flex";

        function hideDropdown() {
            dropdownMenu.style.display = "none";
            userPhotoContainer.removeEventListener('mouseleave', hideDropdown);
        }

        userPhotoContainer.addEventListener('mouseleave', hideDropdown);

        document.addEventListener("click", function(event) {
            if (!userPhotoContainer.contains(event.target)) {
                hideDropdown();
            }
        }, { once: true });
    }

    async logout() {
        await assistOS.logout();
    }
    async addSpace() {
        await assistOS.UI.showModal("add-space-modal", {presenter: "add-space-modal"});
    }

    showNotifications(_target) {
        assistOS.openNotificationMonitor();
    }

    hideNotifications(controller, arrow, event) {
        arrow.setAttribute("data-local-action", "showNotifications off");
        let target = this.element.querySelector(".notifications-box");
        target.style.display = "none";
        controller.abort();
    };

    async swapSpace(_target, id) {
        if(assistOS.space.id === id){
            return;
        }
        window.location.href = window.location.href.split("#")[0] + `#${id}`;
        window.location.reload();
    }
}
