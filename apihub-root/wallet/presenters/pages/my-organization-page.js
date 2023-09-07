export class myOrganizationPage {
    constructor(element) {
        this.element = element;
        this.id = webSkel.company.currentDocumentId;
        if(webSkel.company.documents) {
            this._documentConfigs = (webSkel.company.documents);
            setTimeout(()=> {
                this.invalidate()
            },0);
        }
        this.updateState = ()=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
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