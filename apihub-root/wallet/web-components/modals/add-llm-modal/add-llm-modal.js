import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { LLM } from "../../../imports.js";

export class addLLMModal {
    constructor() {
        if(webSkel.space.settings.llms) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this.invalidate();
        }
        // webSkel.space.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addLLMSubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        closeModal(_target);
        if(formInfo.isValid) {
            let body = formInfo.data;
            let openDSU = require("opendsu");
            let crypto = openDSU.loadApi("crypto");
            body.id = parseInt(crypto.getRandomSecret(16).toString().split(",").join(""));
            body.apiKeys = [body.key];
            body.key = undefined;
            await LLM.storeLLM(currentSpaceId, body);
            webSkel.space.notifyObservers();
        }
    }
}