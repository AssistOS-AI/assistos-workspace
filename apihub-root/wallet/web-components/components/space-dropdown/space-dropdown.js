import { getClosestParentElement, showModal, Space } from "../../../imports.js";

export class spaceDropdown {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.spacesDiv = "";
        this.currentSpaceName = webSkel.space.name;
        currentUser.spaces.filter(space => space.id !== currentSpaceId).forEach((space) => {
            this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
        });
    }

    hideSpaces = () => {
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "none";
        document.removeEventListener("click",this.hideSpaces);
    };

    showSpaces(_target) {
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "flex";
        document.addEventListener("click",this.hideSpaces);
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
        const crypto = require("opendsu").loadAPI("crypto");
        webSkel.getService("AuthenticationService").deleteCachedCurrentUser();
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage("authentication-page", "authentication-page");
    }
}