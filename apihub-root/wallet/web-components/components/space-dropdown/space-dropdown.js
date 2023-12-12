import {
    getClosestParentElement,
    showModal
} from "../../../imports.js";

export class spaceDropdown {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        this.user = JSON.parse(webSkel.getService("AuthenticationService").getCachedCurrentUser());
    }

    beforeRender() {
        if(this.user)
        {
            this.currentSpaceName = webSkel.currentUser.space.name;
        }
    }
    afterRender(){
        let spacesList = this.element.querySelector(".spaces-list");
        setTimeout(async ()=>{
            if(this.user)
            {
                let userId = this.user.id;
                this.userSpaces = JSON.parse(await webSkel.getService("AuthenticationService").getStoredUser(userId)).spaces;
                this.spacesDiv = "";

                this.userSpaces.filter(space => space.id !== webSkel.currentUser.space.id).forEach((space) => {
                    this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
                });
                spacesList.insertAdjacentHTML("afterbegin",this.spacesDiv);
            }
            //else will be redirected to auth page
        },0);
    }

    hideSpaces(controller, arrow, event) {
        arrow.setAttribute("data-local-action", "showSpaces off");
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "none";
        controller.abort();
    };

    showSpaces(_target, mode) {
        if(mode === "off"){
            let target = this.element.querySelector(".spaces-list");
            target.style.display = "flex";
            let controller = new AbortController();
            document.addEventListener("click",this.hideSpaces.bind(this,controller, _target), {signal:controller.signal});
            _target.setAttribute("data-local-action", "showSpaces on");
        }
    }

    async changeSpace(_target) {
        let selectedSpace = getClosestParentElement(_target,['space-unit']);
        let selectedSpaceId = selectedSpace.getAttribute('data-space-id');
        let flowId = webSkel.currentUser.space.getFlowIdByName("ChangeSpace");
        await webSkel.getService("LlmsService").callFlow(flowId, selectedSpaceId);
    }

    async addSpace(){
        await showModal(document.querySelector("body"), "add-space-modal", { presenter: "add-space-modal"});
    }

    async logout(){
        webSkel.getService("AuthenticationService").deleteCachedCurrentUser();
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage("authentication-page", "authentication-page");
    }
}