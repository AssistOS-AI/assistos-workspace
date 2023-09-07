export class myOrganizationPage {
    constructor(element) {
        this.element = element;
        this.id = company.currentDocumentId;
        if(company.documents) {
            this._documentConfigs = (company.documents);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = ()=> {
            this._documentConfigs = company.documents;
            this.invalidate();
        }
        company.onChange(this.updateState);
    }

    beforeRender() {

    }

    openTab(_target) {
        let selectedTab = document.getElementById("selected-tab");
        if(selectedTab !== _target) {
            selectedTab.removeAttribute("id");
            _target.setAttribute("id", "selected-tab");
        }
    }

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}