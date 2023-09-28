import { getClosestParentElement, showModal, Space } from "../../../imports.js";

export class spaceDropdown {
    constructor(element) {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
        this.element = element;
    }

    beforeRender() {
        this.spacesDiv = "";
        this.currentSpaceName = webSkel.space.name;
        currentUser.spaces.filter(space => space.id !== currentSpaceId).forEach((space) => {
            this.spacesDiv += `<space-unit data-space-name="${space.name}" data-space-id="${space.id}"></space-unit>`;
        });
    }
    hideSpaces = ()=>{
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
        let selectedSpaceId = parseInt(selectedSpace.getAttribute('data-space-id'));
        webSkel.space.changeSpace(selectedSpaceId);
    }

    async  addSpace(){
       await showModal(document.querySelector("body"), "add-space-modal", { presenter: "add-space-modal"});
    }
}