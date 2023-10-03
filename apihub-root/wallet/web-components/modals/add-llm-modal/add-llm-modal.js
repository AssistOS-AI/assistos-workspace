import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../../WebSkel/utils/form-utils.js";

export class addLLMModal {
    constructor(element,invalidate) {
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {}
    closeModal(_target) {
        closeModal(_target);
    }
    async addLLM(_target) {
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            let llmData=
            {
                name:formInfo.data.name,apiKeys:[formInfo.data.key],
                url:formInfo.data.url,
                id:webSkel.servicesRegistry.UtilsService.generateId()
            };
            await webSkel.space.addLLM(llmData);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());
            closeModal(_target);
        }
    }
}