import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { Personality } from "../../../imports.js";

export class addPersonalityModal {
    constructor() {
        if(webSkel.space.settings.personalities) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = () => this.invalidate();
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addPersonalitySubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        closeModal(_target);
        if(formInfo.isValid) {
            let body = formInfo.data;
            let openDSU = require("opendsu");
            let crypto = openDSU.loadApi("crypto");
            body.id = crypto.getRandomSecret(16).toString().split(",").join("");
            webSkel.space.addPersonality(body);
            await Personality.storePersonality(currentSpaceId, body);
            webSkel.space.notifyObservers();
        }
    }
}