export class proofReaderPage {
    constructor() {
        if(company.documents) {
            this._documentConfigs = company.documents;
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

    afterRender() {

    }
}