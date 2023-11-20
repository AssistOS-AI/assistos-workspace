import {
    closeModal,
    extractFormInformation
} from "../../../imports.js";

export class userDetailsModal {
    constructor(element,invalidate){
       this.invalidate=invalidate;
       this.invalidate();
       this.element = element;
       this.args = []
        Array.from(this.element.attributes).forEach(attribute => {
                this.args.push(attribute.value)
        });
       this.args.shift();
    }
    closeModal(_target) {
        closeModal(_target);
    }
    beforeRender() {}

    async generateChapters(_target){
        let formInfo = await extractFormInformation(_target);
        let userDetails = {};
        for(let [key,value] of Object.entries(formInfo.data)){
            userDetails[key] = value;
        }
        webSkel.getService("LlmsService").callFlow(...this.args, userDetails);
        closeModal(_target);

    }
}