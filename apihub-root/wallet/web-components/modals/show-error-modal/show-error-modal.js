import {closeModal} from "../../../imports.js"
export class ShowErrorModal{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){}
    closeModal(_target) {
        closeModal(_target);
    }
    async toggleDetails(_target) {
       let details = this.element.querySelector("#detailed-error-message");
       details.style.display = "block";
       _target.style.display = "none";
    }
}