import { Company } from "../../core/company.js";
import { closeModal } from "../../../WebSkel/utils/modal-utils.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";
import { Document } from "../../core/models/document.js";

export class showErrorModal {
    constructor() {
        let currentCompany = Company.getInstance();
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    closeErrorModal(_target) {
        closeModal(_target);
    }

    beforeRender() {

    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}