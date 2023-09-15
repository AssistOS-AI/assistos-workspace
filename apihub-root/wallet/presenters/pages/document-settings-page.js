import { extractFormInformation } from "../../imports.js";

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
        let llmsHTML="";
        let personalitiesHTML="";
        let promptsHTML="";

        // caz 1 no llms
        // caz 2 there is a selected llm already
        // caz 3 no selected llm

        // function select (arrayOfComponents){
        //     let htmlString="";
        //     if(arrayOfComponents.length===0) {
        //         htmlString+=`<option selected disabled >No Component </option>`;
        //     }else {
        //             if(this._document.settings[arrayOfComponents]){
        //                 htmlString+=`<option selected data-id="${this._document.settings.llm.id}"> ${this._document.settings.llm.name}</option>`;
        //             }else{
        //                 htmlString+=`<option selected disabled">No component selected</option>`;
        //             }
        //             for(let llm of webSkel.company.settings.llms){
        //                 if(this._document.settings[arrayOfComponents].name !== llm.name){
        //                     htmlString+=`<option data-id="${llm.id}" selected>${llm.name}</option>`;
        //                 }
        //             }
        //         }
        //     return htmlString;
        // }
        //
        //     llmsHTML+=`<option data-id="${this._document.settings.llm.id}" selected>${this._document.settings.llm.name}</option>`;

            for (let llm of webSkel.company.settings.llms){
                llmsHTML+=`<option data-id="${llm.id}">${llm.name}</option>`;
            }
            this.llms=llmsHTML;
            this.personalities=personalitiesHTML;
    }
    async saveSettings(_target){
        let formInfo = await extractFormInformation(_target);
        if(formInfo.isValid){
            let llmId = parseInt(formInfo.elements.llm.element.getAttribute("data-id"));
            let llmIndex = company.settings.llms.findIndex(llm => llm.id === llmId);

            let personalityId = parseInt(formInfo.elements.personality.element.getAttribute("data-id"));
            let personalityIndex = company.settings.personality.findIndex(personality => personality.id === personalityId);
            if(llmIndex !== -1 && personalityIndex!==-1){
                this.document.settings={llm:company.settings.llms[llmIndex],personality:company.settings.personalities[personalityIndex]};
            }

        }
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