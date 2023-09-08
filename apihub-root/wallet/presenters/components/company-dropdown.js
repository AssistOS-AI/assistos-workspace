export class companyDropdown {
    constructor(element) {
        this.element = element;
        this.currentCompanyName = "Personal Space";
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        /* to be removed */
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
        this.currentCompanyName = _target.innerText;
        this.element.querySelector(".organization-name").innerText = this.currentCompanyName;
        let target = _target.parentElement.parentElement;
        target.style.display = "none";
    }
}