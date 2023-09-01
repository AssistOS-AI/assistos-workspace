import { Company } from "../../core/company.js";

export class proofReaderPage {
    constructor() {
        let currentCompany = Company.getInstance();
        if(currentCompany.companyState) {
            this._documentConfigs = currentCompany.companyState.documents;
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = (companyState)=> {
            console.log("Update State");
            this._documentConfigs = companyState.documents;
            this.invalidate();
        }
        currentCompany.onChange(this.updateState);
    }

    beforeRender() {

    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}