import {
    getClosestParentElement,
    showModal
} from "../../../imports.js";

export class SpaceDropdown {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.currentSpaceName = system.space.name;
    }

    afterRender() {
        let spacesList = this.element.querySelector(".spaces-list");
        this.spacesDiv = "";
        system.services.getUserSpaces().filter(space => space.id !== system.space.id).forEach((space) => {
            this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
        });
        spacesList.insertAdjacentHTML("afterbegin", this.spacesDiv);
    }


    hideSpaces(controller, container, event) {
        container.setAttribute("data-local-action", "showSpaces off");
        let target = this.element.querySelector(".spaces-list");
        target.style.display = "none";
        controller.abort();
        let arrow = container.querySelector(".arrow");
        arrow.classList.add("rotated");
    }
    ;

    showSpaces(_target, mode) {
        if (mode === "off") {
            let target = this.element.querySelector(".spaces-list");
            target.style.display = "flex";
            let arrow = _target.querySelector(".arrow");
            arrow.classList.remove("rotated");
            let controller = new AbortController();
            document.addEventListener("click", this.hideSpaces.bind(this, controller, _target), {signal: controller.signal});
            _target.setAttribute("data-local-action", "showSpaces on");
        }
    }

    async changeSpace(_target) {
        let selectedSpace = getClosestParentElement(_target, ['space-unit']);
        let selectedSpaceId = selectedSpace.getAttribute('data-space-id');
        await system.services.changeSpace(selectedSpaceId);
    }

    async addSpace() {
        await showModal("add-space-modal", {presenter: "add-space-modal"});
    }

    async logout() {
        system.services.deleteCachedCurrentUser();
        system.UI.setDomElementForPages(mainContent);
        await system.UI.changeToDynamicPage("authentication-page", "authentication-page");
    }
}