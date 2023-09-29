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
            let llmData={name:formInfo.data.name,apiKeys:[formInfo.data.key],url:formInfo.data.url, id:webSkel.servicesRegistry.UtilsService.generateRandomHex(32)};
            await webSkel.space.storeLLM(llmData);
        }
    }
}