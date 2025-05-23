const spaceModule = assistOS.loadModule("space");
const agentModule = assistOS.loadModule("agent");
import {generateAvatar} from "../../../../imports.js";

export class AddAgent {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    triggerInputFileOpen(_target){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
        _target.setAttribute("data-local-action", "triggerInputFileOpen");
    }

    async addAgentSubmitForm(_target) {
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        if(formInfo.isValid) {
            //let uint8Array = await generateAvatar(formInfo.data.name);
            //let imageId = await spaceModule.putImage(uint8Array);
            let agentData = {
                name: formInfo.data.name,
                //imageId: imageId,
                description: formInfo.data.description,
            };
            try {
                await agentModule.addAgent(assistOS.space.id, agentData);
            } catch (e) {
                assistOS.showToast(e.message, "error", 3000);
            }

            //document.querySelector('chat-container').webSkelPresenter.invalidate();
            assistOS.UI.closeModal(_target,{refresh:true});
        }
    }
}