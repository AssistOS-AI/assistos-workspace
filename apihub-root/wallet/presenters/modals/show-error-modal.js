import { Company } from "../../core/company.js";
import { closeModal } from "../../../WebSkel/utils/modal-utils.js";

export class showErrorModal {
    constructor() {
        let currentCompany = Company.getInstance();
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyState)=> {
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeErrorModal(_target) {
        closeModal(_target);
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}