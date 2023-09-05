import { Company } from "../../core/company.js";

export class companyDropdown {
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
        this.companies = ["Outfinity", "AIAuthor", "Pharma Ledger"];
    }

    beforeRender() {
        this.companiesDiv = "";
        this.companies.forEach((company) => {
            this.companiesDiv += `<company-item company-name="${company}"></company-item>`;
        });
    }

    showOrganizations(_target) {
        let target = _target.nextElementSibling;
        target.style.display = "flex";
    }

    changeOrganisation(_target) {
        let target = _target.parentElement.parentElement;
        target.style.display = "none";
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}