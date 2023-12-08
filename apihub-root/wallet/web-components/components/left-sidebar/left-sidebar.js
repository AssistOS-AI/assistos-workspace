import {getClosestParentElement} from "../../../imports.js";

export class leftSidebar {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {

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
        setInterval(updateClock, 30000);
    }
    async changePage(_target, pageId, refreshFlag='0'){
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
}