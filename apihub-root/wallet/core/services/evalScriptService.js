import {showModal, closeModal} from "../../imports.js"
export class EvalScriptService {

    constructor() {
        this.think = "Thinking...";
    }

    setThink(text){
        this.think = text;
    }

    async evalAndExecScript(...args){
        let script =webSkel.space.getScript(args[0]);
        let scriptCode = eval(script.content);
        args.shift();
        await this.displayThink();
        let result =  await webSkel.getService("LlmsService").callScript(script.name, scriptCode, args);
        closeModal(document.querySelector(".console-container"));
        return result;
    }
    async displayThink(){
        await showModal(document.querySelector("body"),"prompt-animation", {prompt: this.think});
        this.animateThink(document.querySelector("prompt-animation"));
    }
    animateThink(element) {
        let visible = true;
        let con = element.querySelector("#console");
        let letterCount = 1;
        let x = 1;
        let waiting = false;
        let target = element.querySelector(".animation-space");
        setInterval(() => {
            if (letterCount === 0 && waiting === false) {
                waiting = true;
                target.innerHTML = this.think.substring(0, letterCount);
                setTimeout(() => {
                    let usedWord = this.think.shift();
                    this.think.push(usedWord);
                    x = 1;
                    letterCount += x;
                    waiting = false;
                }, 50);
            } else if(letterCount === this.think.length + 1 && waiting === false){
                return;
            }else if (waiting === false) {
                target.innerHTML = this.think.substring(0, letterCount);
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