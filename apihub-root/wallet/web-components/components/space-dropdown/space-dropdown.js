import {
    getClosestParentElement,
    showModal
} from "../../../imports.js";

export class SpaceDropdown {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        this.user = JSON.parse(system.services.getCachedCurrentUser());
    }

    beforeRender() {
        if(this.user)
        {
            this.currentSpaceName = system.space.name;
        }
    }
    afterRender(){
        let spacesList = this.element.querySelector(".spaces-list");
        setTimeout(async ()=>{
            if(this.user)
            {
                let userId = this.user.id;
                this.userSpaces = JSON.parse(await system.services.getStoredUser(userId)).spaces;
                this.spacesDiv = "";

                this.userSpaces.filter(space => space.id !== system.space.id).forEach((space) => {
                    this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
                });
                spacesList.insertAdjacentHTML("afterbegin",this.spacesDiv);
            }
            //else will be redirected to auth page
        },0);
    }

    hideSpaces(controller, container, event) {
        container.setAttribute("data-local-action", "showSpaces off");
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "none";
        controller.abort();
        let arrow = container.querySelector(".arrow");
        arrow.classList.add("rotated");
    };

    showSpaces(_target, mode) {
        if(mode === "off"){
            let target = this.element.querySelector(".spaces-list");
            target.style.display = "flex";
            let arrow = _target.querySelector(".arrow");
            arrow.classList.remove("rotated");
            let controller = new AbortController();
            document.addEventListener("click",this.hideSpaces.bind(this,controller, _target), {signal:controller.signal});
            _target.setAttribute("data-local-action", "showSpaces on");
        }
    }

    async changeSpace(_target) {
        let selectedSpace = getClosestParentElement(_target,['space-unit']);
        let selectedSpaceId = selectedSpace.getAttribute('data-space-id');
        let flowId = system.space.getFlowIdByName("ChangeSpace");
        await system.services.callFlow(flowId, selectedSpaceId);
    }

    async addSpace(){
        await showModal("add-space-modal", { presenter: "add-space-modal"});
    }

    async logout(){
        system.services.deleteCachedCurrentUser();
        system.UI.setDomElementForPages(mainContent);
        await system.UI.changeToDynamicPage("authentication-page", "authentication-page");
    }
}