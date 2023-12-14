import {getClosestParentElement,decodeBase64} from "../../../imports.js";

export class leftSidebar {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.applications = "";
        for (let application of webSkel.currentUser.space.installedApplications) {
            let applicationData = webSkel.getApplicationData(parseInt(application.id));

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
    /* temporary solution until proper and complete implementations of applications  */
    async startApplication(_target, applicationId) {
        switch(parseInt(applicationId)){
            case 1:
                this.changeBaseURL(`/app/${webSkel.currentUser.space.id}/${applicationId}`);
                await this.changePage(_target,"chatbots-select-personality-page",applicationId);
                break;
            case 2:
                this.changeBaseURL(`/app/${webSkel.currentUser.space.id}/${applicationId}`);
                await this.changePage(_target,"documents-page",applicationId);
                break;
            case 3:
                this.changeBaseURL(`/app/${webSkel.currentUser.space.id}/${applicationId}`);
                await this.changePage(_target,"proof-reader-page",applicationId);
                break;
            case 4:
                this.changeBaseURL(`/app/${webSkel.currentUser.space.id}/${applicationId}`);
                await this.changePage(_target,"translate-page",applicationId);
                break;
            case 5:
                this.changeBaseURL(`/app/${webSkel.currentUser.space.id}/${applicationId}`);
                await this.changePage(_target,"image-brainstorming-page",applicationId);
                break;
        }
    }
    changeBaseURL(newBaseURL) {
        document.getElementById('baseTag').setAttribute('href', newBaseURL);
    }
    afterRender(){
        let features = this.element.querySelectorAll(".feature");
        features.forEach((feature)=>{
            let timeoutId;
            feature.addEventListener("mouseover",()=>{
                timeoutId = setTimeout(()=>{
                    let name = feature.querySelector(`[id=${feature.getAttribute("data-id")}]`);
                    name.style.visibility = "visible";
                },1000);
            });
            feature.addEventListener("mouseout",()=>{
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
    }
    async changePage(_target, pageId,applicationId, refreshFlag='0'){
        debugger;
        await webSkel.startApplication(applicationId);
        let flowId = webSkel.currentUser.space.getFlowIdByName("ChangeApplication");
        await webSkel.getService("LlmsService").callFlow(flowId, pageId, refreshFlag);
        getClosestParentElement(_target, ".feature").setAttribute("id", "selected-page");
        let paths = _target.querySelectorAll("path");
        paths.forEach((path)=>{
            if(path.hasAttribute("stroke")){
                path.setAttribute("stroke", "var(--left-sidebar)");
            }
            path.setAttribute("fill", "var(--left-sidebar)");
        });
    }
    showNotifications(_target, mode){
        if(mode === "off"){
            let target = this.element.querySelector(".notifications-box");
            target.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click",this.hideNotifications.bind(this,controller, _target), {signal:controller.signal});
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