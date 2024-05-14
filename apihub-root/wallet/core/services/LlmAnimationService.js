export class LlmAnimationService {

    constructor() {
        this.keepAnimating = true;
    }

    async displayThink(prompt){
        await assistOS.UI.showModal("llm-animation");
        let phrases = ["Generating response..."];
        let animation = document.querySelector("llm-animation");
        if (animation) {
            this.keepAnimating = true;

            this.timeoutId = setTimeout(() => this.animateThink(animation, phrases), 500);
        } else {
            console.error("Animation container 'llm-animation' was not found.");
        }
    }

    closeThink(){
        // Stop the animation
        this.keepAnimating = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        assistOS.UI.closeModal(document.querySelector("llm-animation"));
    }

    async animateThink(element, phrases) {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        let mainText = element.querySelector(".main-text");
        if (!mainText) {
            console.error("Main text element was not found inside 'llm-animation'.");
            return;
        }

        for (let phrase of phrases) {
            if (!this.keepAnimating) {
                return;
            }

            mainText.style.animation = "fade-in-down 0.5s ease-in forwards";
            mainText.innerHTML = phrase;
            await delay(2000);

            if (!this.keepAnimating) {
                return;
            }

            mainText.style.animation = "fade-out-down 0.5s ease-out forwards";
            await delay(500);
        }

        if (this.keepAnimating) {
            this.timeoutId = setTimeout(() => this.animateThink(element, phrases), 2500);
        }
    }
}
