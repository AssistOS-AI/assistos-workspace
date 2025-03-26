import {changeSelectedPageFromSidebar} from "../../../../imports.js";
const spaceModule = require("assistos").loadModule("space", {});
const utilModule = require("assistos").loadModule("util", {});
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
            this.tasks = await utilModule.getTasks(assistOS.space.id);
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
            let uint8Array = await this.generateUserAvatar(assistOS.user.email);
            assistOS.user.imageId = await spaceModule.putImage(uint8Array);
            await userModule.updateUserImage(assistOS.user.id, assistOS.user.imageId);
        };
        img.src = userImageURL;
        img.onload = () => {
            img.remove();
        };
        this.userImage = userImageURL;
        this.userName = assistOS.user.name;
        for (let application of assistOS.space.installedApplications) {
            let applicationData = assistOS.applications[application.name];
            let svgImage = applicationData.svg;

            this.applications += `
        <div class="feature" data-id="${applicationData.name.toLowerCase()}" data-local-action="startApplication ${applicationData.id}">
            <div class="app-focus hidden"></div>
            <div class="page-logo">
                ${svgImage}
                <div class="app-name" id="${applicationData.name.toLowerCase()}">
                    ${applicationData.name}
                </div>
            </div>
        </div>`;
        }
        let stringHTML = "";
        for(let space of assistOS.user.spaces){
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
        let userSection = this.element.querySelector(".user-photo-container");
        let userActions = this.element.querySelector(".user-action-menu");
        userSection.addEventListener("mouseover", () => {
            userActions.style.visibility = "visible";
        });
        userSection.addEventListener("mouseout", () => {
            userActions.style.visibility = "hidden";
        });
        userActions.addEventListener("mouseout", (event) => {
            if(!userActions.contains(event.relatedTarget)){
                userActions.style.visibility = "hidden";
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

   toggleChat(_target, mode, width) {
        const maximizeChat = () => {
            assistOS.UI.chatState = "open";
            let spaceApplicationPage = document.querySelector('space-application-page');
            let minimumChatWidth = 0.35 * parseFloat(getComputedStyle(spaceApplicationPage).width);
            agentPage.style.display = "flex";
            agentPage.style.minWidth = minimumChatWidth + 'px';
            agentPage.style.width = (width || assistOS.UI.chatWidth || minimumChatWidth) + 'px';
            assistOS.UI.chatWidth = width || assistOS.UI.chatWidth || minimumChatWidth;
            document.cookie=`chatState=open;path=/;max-age=31536000;`;
        }

        const minimizeChat = () => {
            assistOS.UI.chatState = "close";
            agentPage.style.display = "none";
            agentPage.style.width = "0px";
            agentPage.style.minWidth = "0px";
            document.cookie=`chatState=close;path=/;max-age=31536000;`;
        }

        const agentPage = document.querySelector("chat-page");

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
    async generateUserAvatar(email, size = 100) {
        let firstLetter = email.charAt(0).toUpperCase();
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Generate a random background color
        ctx.fillStyle = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${size * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstLetter, size / 2, size / 2);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        canvas.remove();
        return uint8Array;
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
