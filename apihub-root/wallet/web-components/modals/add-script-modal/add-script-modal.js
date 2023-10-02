import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../imports.js";

export class addScriptModal {
    constructor() {
        if(webSkel.space.scripts) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addScript(_target) {
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid) {
            let script = formInfo.data;
            script.id = Math.floor(Math.random() * 100000).toString();
            await webSkel.space.addScript(script);
            webSkel.space.notifyObservers(webSkel.space.getNotificationId());
            closeModal(_target);
        }
    }
}