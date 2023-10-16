import {closeModal} from "../../../imports.js"
export class showErrorModal{
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
       if(!details.style.display || details.style.display === "none"){
           details.style.display = "block";
       }else {
           details.style.display = "none";
       }
    }
}