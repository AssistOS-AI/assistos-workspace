import { Company } from "../../core/company.js";

export class companyDropdown {
    constructor() {
        if(webSkel.company.documents) {
            this._documentConfigs =webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
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

    changeOrganization(_target) {
        let target = _target.parentElement.parentElement;
        target.style.display = "none";
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}