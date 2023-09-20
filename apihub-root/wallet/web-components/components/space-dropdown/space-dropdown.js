import { getClosestParentElement, showModal } from "../../../imports.js";

export class spaceDropdown {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.space.onChange(this.updateState);
    }

    beforeRender() {
        this.spacesDiv = "";
        this.currentSpaceName = webSkel.space.name;
        webSkel.servicesRegistry.spaceService.getSpaceNames().forEach((space) => {
            this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
        });
    }

    showSpaces(_target) {
        let target = _target.nextElementSibling;
        target.style.display = "flex";
    }

    changeSpace(_target) {
        let selectedSpace = getClosestParentElement(_target,['space-unit']);
        let selectedSpaceId = parseInt(selectedSpace.getAttribute('data-space-id'));
        webSkel.servicesRegistry.spaceService.changeSpace(selectedSpaceId);
    }
    async  addSpace(){
       await showModal(document.querySelector("body"), "add-space-modal", { presenter: "add-space-modal"});
    }
}