export class promptAnimation {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.prompt = this.element.getAttribute("data-prompt");
    }
    afterRender(){
        this.buildPrompt();
    }

    buildPrompt(_target) {
        let visible = true;
        let con = this.element.querySelector("#console");
        let letterCount = 1;
        let x = 1;
        let waiting = false;
        let target = this.element.querySelector(".animation-space");
        setInterval(() => {
            if (letterCount === 0 && waiting === false) {
                waiting = true;
                target.innerHTML = this.prompt.substring(0, letterCount);
                setTimeout(() => {
                    let usedWord = this.prompt.shift();
                    this.prompt.push(usedWord);
                    x = 1;
                    letterCount += x;
                    waiting = false;
                }, 50);
            } else if(letterCount === this.prompt.length + 1 && waiting === false){
                    return;
            }else if (waiting === false) {
                target.innerHTML = this.prompt.substring(0, letterCount);
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