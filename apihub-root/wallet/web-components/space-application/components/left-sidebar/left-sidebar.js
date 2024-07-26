import {changeSelectedPageFromSidebar} from "../../../../imports.js";
export class LeftSidebar {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.themeIcon = "wallet/assets/icons/moon.svg";
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        this.userImage = assistOS.user.photo;
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

    async startApplication(_target, appName) {
        if(appName === assistOS.currentApplicationName){
            return;
        }
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
    afterRender() {
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
    async changePage(_target, pageId, applicationId, refreshFlag = '0') {
        await assistOS.callFlow("ChangeApplication", {
            pageId: pageId,
            refreshFlag: refreshFlag
        });
        assistOS.UI.getClosestParentElement(_target, ".feature").setAttribute("id", "selected-page");
        let paths = _target.querySelectorAll("path");
        paths.forEach((path) => {
            if (path.hasAttribute("stroke")) {
                path.setAttribute("stroke", "var(--left-sidebar)");
            }
            path.setAttribute("fill", "var(--left-sidebar)");
        });
    }

    showNotifications(_target, mode) {
        if (mode === "off") {
            let target = this.element.querySelector(".notifications-box");
            target.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click", this.hideNotifications.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showNotifications on");
        }
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
        await assistOS.loadPage(false,false, id);
    }
}
