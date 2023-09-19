import {extractFormInformation} from "../../../../WebSkel/utils/form-utils.js";
import { closeModal } from "../../../imports.js";
import {Document} from "../../../core/models/document.js";
import {companyService} from "../../../imports.js";

export class addCompanyModal {
    constructor() {
        setTimeout(()=> {
            this.invalidate()
        }, 0);
        this.updateState = ()=>this.invalidate();
        webSkel.company.onChange(this.updateState);
    }
    closeModal(_target) {
        closeModal(_target);
    }
    beforeRender() {
    }
    async addCompany(_target){
        let formData = await extractFormInformation(_target);
        if(formData.isValid) {
            await webSkel.servicesRegistry.companyService.addCompany(formData.data.name);
        }
    }
}