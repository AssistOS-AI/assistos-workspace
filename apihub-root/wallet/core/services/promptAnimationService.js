import {showModal, closeModal} from "../../imports.js"
export class PromptAnimationService {

    constructor() {
        this.delay = 20;
    }

    async displayThink(prompt){
        if(prompt.length > 100){
            prompt = prompt.substring(0, 100);
            prompt+= "...";
        }
        await showModal(document.querySelector("body"),"prompt-animation");
        this.animateThink(document.querySelector("prompt-animation"), prompt);
    }

     closeThink(prompt){
        return new Promise((resolve, reject)=>{
            let intervalId = setInterval(async ()=>{
                if(this.stop){
                    clearInterval(intervalId);
                    if(prompt !== "Thinking..."){
                        const delay = ms => new Promise(res => setTimeout(res, ms));
                        await delay(3000);
                    }
                    closeModal(document.querySelector(".console-container"));
                    clearInterval(this.intervalId);
                    resolve();
                    this.stop = false;
                }
            },1000);
        });

    }
    animateThink(element,prompt) {
            let visible = true;
            let con = element.querySelector("#console");
            let letterCount = 1;
            let x = 1;
            let waiting = false;
            let target = element.querySelector(".animation-space");
            this.intervalId = setInterval(async () => {
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
                    this.stop = true;
                    return;
                }else if (waiting === false) {
                    target.innerHTML = prompt.substring(0, letterCount);
                    letterCount += x;
                }
            }, this.delay);
            let underscoreInterval = window.setInterval(async ()=> {
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

    async animateCall(){
        let pencil = document.querySelector(".pencil");
        let paper  = document.querySelector(".paper");
        let firstLine = "<div class='line first'></div>";
        paper.insertAdjacentHTML("beforeend", firstLine);
        const delay = ms => new Promise(res => setTimeout(res, ms));
        await delay(5000);
        let line = "<div class='line'></div>";
        for(let i = 0; i<4;i++){
            paper.insertAdjacentHTML("beforeend", line);
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await delay(5000);
        }

        let lines = paper.querySelectorAll(".line");
        pencil.classList.remove("pencil-write");
        pencil.classList.add("pencil-erase");
        for( let i = lines.length-1; i>=0; i--){
            lines[i].style.transform = "scaleX(1)";
            lines[i].style.animation = "line-erase 5s forwards";
            const delay = ms => new Promise(res => setTimeout(res, ms));
            await delay(5000);
            lines[i].remove();
        }
    }
}