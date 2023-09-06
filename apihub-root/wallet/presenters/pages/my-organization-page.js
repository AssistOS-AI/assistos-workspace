export class myOrganizationPage {
    constructor() {
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

    /* adding event Listeners after the web component has loaded, etc */
    afterRender() {

    }
}