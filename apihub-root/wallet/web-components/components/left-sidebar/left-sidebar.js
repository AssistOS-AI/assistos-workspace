import {getClosestParentElement, decodeBase64, changeSelectedPageFromSidebar} from "../../../imports.js";

export class LeftSidebar {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        for (let application of system.space.installedApplications) {
            let applicationData = system.applications[application.name];
            let svgImage = applicationData.encodedSvg;
            this.applications += `
            <div class="feature" data-id="${applicationData.name.toLowerCase()}" data-local-action="startApplication ${applicationData.id}">
                <div class="page-logo">
                       ${decodeBase64(svgImage)}
                    <div class="app-name" id="${applicationData.name.toLowerCase()}">
                        ${applicationData.name}
                    </div>
                </div>
            </div>`;
        }
    }

    async startApplication(_target, appName) {
        //this.changeBaseURL(appName);
        await system.services.startApplication(appName);
        changeSelectedPageFromSidebar(window.location.hash);
    }

    changeBaseURL(newBaseURL) {
        document.getElementById('baseTag').setAttribute('href', newBaseURL);
    }

    afterRender() {
        let features = this.element.querySelectorAll(".feature");
        features.forEach((feature) => {
            let timeoutId;
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

    async changePage(_target, pageId, applicationId, refreshFlag = '0') {
        let flowId = system.space.getFlowIdByName("ChangeApplication");
        let context = {
            pageId: pageId,
            refreshFlag: refreshFlag
        }
        await system.services.callFlow(flowId, context);
        getClosestParentElement(_target, ".feature").setAttribute("id", "selected-page");
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
}
