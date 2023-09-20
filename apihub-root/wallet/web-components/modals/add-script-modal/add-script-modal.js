import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";
import {extractFormInformation} from "../../../imports.js";
export class addScriptModal {
    constructor() {
        if(webSkel.company.settings.personalities) {
            this._personalityConfigs = webSkel.company.settings.personalities;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._personalityConfigs = webSkel.company.settings.personalities;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    async addScript(_target) {
        //how to access req body from apihub?
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid){
            let body = formInfo.data;
            body.id = Math.floor(Math.random() * 100000);
            let response = await fetch(`/space/${window.currentCompanyId}/myspace/scripts/add`, {
                method: "POST",
                body: body,
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            });

            console.log(response);
        }
    }
}