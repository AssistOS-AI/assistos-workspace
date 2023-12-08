import {getClosestParentElement} from "../../../imports.js";

export class leftSidebar {
    constructor(element,invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {

    }
    afterRender(){
        let features = document.querySelectorAll(".feature");
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
    }
    async changePage(_target, pageId, refreshFlag='0'){
        let flowId = webSkel.currentUser.space.getFlowIdByName("ChangeApplication");
        await webSkel.getService("LlmsService").callFlow(flowId, pageId, refreshFlag);
        getClosestParentElement(_target, ".feature").setAttribute("id", "selected-page");
        let paths = _target.querySelectorAll("path");
        paths.forEach((path)=>{
            path.setAttribute("fill", "var(--left-sidebar)");
        });
    }
}