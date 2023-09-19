import { getClosestParentElement, showModal } from "../../../imports.js";

export class companyDropdown {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
            }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.companiesDiv = "";
        this.currentCompanyName = webSkel.company.name;
        webSkel.servicesRegistry.companyService.getCompanyNames().forEach((company) => {
            this.companiesDiv += `<company-unit data-company-name="${company.name}" data-company-id="${company.id}"></company-unit>`;
        });
    }

    showOrganizations(_target) {
        let target = _target.nextElementSibling;
        target.style.display = "flex";
    }

    changeOrganization(_target) {
        let selectedCompany = getClosestParentElement(_target,['company-unit']);
        let selectedCompanyId = parseInt(selectedCompany.getAttribute('data-company-id'));
        webSkel.servicesRegistry.companyService.changeCompany(selectedCompanyId);
    }
    async  addOrganization(){
       await showModal(document.querySelector("body"), "add-company-modal", { presenter: "add-company-modal"});
    }
}