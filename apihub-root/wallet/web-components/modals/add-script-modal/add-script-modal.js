import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import { extractFormInformation } from "../../../imports.js";

export class addScriptModal {
    constructor() {
        if(webSkel.space.scripts) {
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this.invalidate();
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
            let body = formInfo.data;
            body.id = Math.floor(Math.random() * 100000).toString();
            await webSkel.space.addScript(body);
        }
    }
}