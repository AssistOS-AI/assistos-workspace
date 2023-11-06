import {
    getClosestParentElement,
    showModal
} from "../../../imports.js";

export class spaceDropdown {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.spacesDiv = "";
        if(webSkel.space){
            this.currentSpaceName = webSkel.space.name;
            currentUser.spaces.filter(space => space.id !== currentSpaceId).forEach((space) => {
                this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
            });
        }

    }

    hideSpaces(controller, event) {
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "none";
        controller.abort();
    };

    showSpaces(_target) {
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "flex";
        let controller = new AbortController();
        document.addEventListener("click",this.hideSpaces.bind(this,controller), {signal:controller.signal});
    }

    changeSpace(_target) {
        let selectedSpace = getClosestParentElement(_target,['space-unit']);
        let selectedSpaceId = selectedSpace.getAttribute('data-space-id');
        webSkel.space.changeSpace(selectedSpaceId);
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