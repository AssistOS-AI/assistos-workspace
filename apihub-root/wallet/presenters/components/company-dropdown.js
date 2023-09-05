import { Company } from "../../core/company.js";
import { getClosestParentElement } from "../../../WebSkel/utils/dom-utils.js";

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
        // this.docId = webSkel.registry.currentDocumentId;
        // this._document = webSkel.registry.getDocument(this.docId);
        // this.chapter = this._document.getCurrentChapter();
    }

    beforeRender() {
        this.companiesDiv = "";
        this.companies.forEach((companyName) => {
            this.companiesDiv += `<company-item>${companyName}</company-item>`;
        });
    }

    showOrganizations(_target) {
        let target = _target.nextElementSibling;
        target.style.display = "flex";
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}