import {showModal, closeModal} from "../../imports.js"
export class PromptAnimationService {

    constructor() {
        this.delay = 20;
    }

    async displayThink(prompt){
        await showModal(document.querySelector("body"),"prompt-animation");
        this.animateThink(document.querySelector("prompt-animation"), prompt);
    }

    async closeThink(){

        let interval = setInterval(async()=>{
            if(!this.intervalId){
                const delay = ms => new Promise(res => setTimeout(res, ms));
                await delay(3000);
                closeModal(document.querySelector(".console-container"));
                clearInterval(interval);
            }
        },1000);

    }
    animateThink(element,prompt) {
        let visible = true;
        let con = element.querySelector("#console");
        let letterCount = 1;
        let x = 1;
        let waiting = false;
        let target = element.querySelector(".animation-space");
        this.intervalId = setInterval(() => {
            if (letterCount === 0 && waiting === false) {
                waiting = true;
                target.innerHTML = prompt.substring(0, letterCount);
                setTimeout(() => {
                    let usedWord = prompt.shift();
                    prompt.push(usedWord);
                    letterCount += x;
                    waiting = false;
                }, this.delay);
            } else if(letterCount === prompt.length + 1 && waiting === false){
                clearInterval(this.intervalId);
                delete this.intervalId;
                return;
            }else if (waiting === false) {
                target.innerHTML = prompt.substring(0, letterCount);
                letterCount += x;
            }
        }, this.delay);
        let underscoreInterval = window.setInterval(()=> {
            if(!this.intervalId){
                clearInterval(underscoreInterval);
            }
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