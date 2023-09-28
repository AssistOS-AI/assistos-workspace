import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";
import { LLM } from "../../../imports.js";

export class editLLMKeyModal {
    constructor(element) {
        this.element = element;
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

    async saveKeySubmitForm(_target) {
        let formInfo = await extractFormInformation(_target);
        closeModal(_target);
        if(formInfo.isValid) {
            let body = formInfo.data;
            let updatedLLM = webSkel.space.addLLMKey(this.element.getAttribute("data-id"), body.key);
            await LLM.storeLLM(currentSpaceId, updatedLLM);
            webSkel.space.notifyObservers();
        }
    }
}