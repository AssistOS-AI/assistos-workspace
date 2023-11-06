import {parseURL} from "../../../imports.js";

export class chatbotsPage {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate=invalidate;
        this.invalidate();
        let personalityId = parseURL();
        this.personality = webSkel.space.getPersonality(personalityId);
    }
    beforeRender() {

    }


}