import {showModal, closeModal} from "../../imports.js"
export class LlmAnimationService {

    constructor() {
    }

    async displayThink(prompt){
        await showModal(document.querySelector("body"),"llm-animation");
        let phrases = ["Seeking inspiration","Generating new ideas","Making ideas come to reality"];
        let animation = document.querySelector("llm-animation");
        this.timeoutId = setTimeout(this.animateThink.bind(this),500,animation,phrases);
    }

     closeThink(){
        clearTimeout(this.timeoutId);
        closeModal(document.querySelector("llm-animation"));
    }
    async animateThink(element,phrases) {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        let mainText = element.querySelector(".main-text");
        for(let phrase of phrases){
            mainText.style.animation = "fade-in-down 0.5s ease-in forwards";
            mainText.innerHTML = phrase;
            await delay(2000);
            mainText.style.animation = "fade-out-down 0.5s ease-out forwards";
            await delay(500);
        }
        this.timeoutId = setTimeout(this.animateThink.bind(this),0,element,phrases);
    }
}