import {reverseQuerySelector} from "../../../imports.js";

export class chatbotsSelectPersonalityPage {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.personalityBlocks = "";
        if (webSkel.space.settings.personalities.length > 0) {
            webSkel.space.settings.personalities.forEach((item) => {
                this.personalityBlocks += `<personality-unit data-name="${item.name}" data-description="${item.description}" data-id="${item.id}" data-image="${item.image}"></personality-unit>`;
            });
        }else {
            this.personalityBlocks = `<div class="no-personality">No personality defined</div>`;
        }
    }

    async selectPersonality(_target){
        let personality = reverseQuerySelector(_target,"personality-unit");
        await webSkel.changeToDynamicPage("chatbots-page", "chatbots-page",{personality:`${personality.getAttribute("data-id")}`});
    }
}