import {showModal, closeModal, sanitize} from "../../imports.js"
export class PromptAnimationService {

    constructor() {
    }

    async displayThink(prompt){
        await showModal(document.querySelector("body"),"prompt-animation", {prompt: sanitize(prompt)});
        this.animateThink(document.querySelector("prompt-animation"), prompt);
    }

    closeThink(){
        closeModal(document.querySelector(".console-container"));
    }
    animateThink(element, prompt) {
        let visible = true;
        let con = element.querySelector("#console");
        let letterCount = 1;
        let x = 1;
        let waiting = false;
        let target = element.querySelector(".animation-space");
        setInterval(() => {
            if (letterCount === 0 && waiting === false) {
                waiting = true;
                target.innerHTML = prompt.substring(0, letterCount);
                setTimeout(() => {
                    let usedWord = prompt.shift();
                    prompt.push(usedWord);
                    x = 1;
                    letterCount += x;
                    waiting = false;
                }, 50);
            } else if(letterCount === prompt.length + 1 && waiting === false){
                return;
            }else if (waiting === false) {
                target.innerHTML = prompt.substring(0, letterCount);
                letterCount += x;
            }
        }, 50);
        window.setInterval(()=> {
            if (visible === true) {
                con.className = 'console-underscore hidden'
                visible = false;
            } else {
                con.className = 'console-underscore'
                visible = true;
            }
        }, 400);
    }
}