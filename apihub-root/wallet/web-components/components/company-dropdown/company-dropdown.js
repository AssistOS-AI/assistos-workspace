import { getClosestParentElement, showModal } from "../../../imports.js";

export class companyDropdown {
    constructor(element) {
        this.element = element;
        this.currentCompanyName = (currentUser.companies.find((company) => company.id === currentCompanyId)).name;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        /* to be removed */
        this.companies = currentUser.companies.filter(company => company.id !== currentCompanyId);
    }

    beforeRender() {
        this.companiesDiv = "";
        this.companies.forEach((company) => {
            this.companiesDiv += `<company-item data-company-name="${company.name}" data-company-id="${company.id}"></company-item>`;
        });
    }

    showOrganizations(_target) {
        let target = _target.nextElementSibling;
        target.style.display = "flex";
    }

    changeOrganization(_target) {
        let selectedCompany = getClosestParentElement(_target,['company-item']);
        let selectedCompanyId = parseInt(selectedCompany.getAttribute('data-company-id'));
        window.changeCompany(selectedCompanyId);
    }

    async  addOrganization(){
       await showModal(document.querySelector("body"), "add-company-modal");
    }
}