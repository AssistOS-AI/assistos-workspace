export class documentSettingsPage {
    constructor() {
        let url = window.location.hash;
        this.id = parseInt(url.split('/')[1]);
        if(webSkel.company.documents) {
            this._documentConfigs = webSkel.company.documents;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = (companyData)=> {
            this._documentConfigs = webSkel.company.documents;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
        this.documentService = webSkel.initialiseService('documentService');
        this._document = this.documentService.getDocument(this.id);
    }

    beforeRender() {

    }

    openEditTitlePage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-title`);
    }

    openEditAbstractPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/edit-abstract`);
    }

    openDocumentSettingsPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/settings`);
    }

    openBrainstormingPage() {
        webSkel.changeToStaticPage(`documents/${this.id}/brainstorming`);
    }

    openViewPage() {
        webSkel.changeToStaticPage(`documents/${this.id}`);
    }
}